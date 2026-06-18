import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  organizerApplications,
  organizerProfiles,
  users,
} from '../db/schema/index.js';
import { decrypt, maskAccountNumber } from '../utils/encryption.js';
import { createSubaccount }   from './paystack.service.js';
import { getSettings }  from './platform.service.js';
import {
  enqueueOrganizerApprovedEmail,
  enqueueOrganizerRejectedEmail,
  enqueueOrganizerSuspendedEmail,
} from '../jobs/producers/email.producer.js';
import { logger } from '../lib/logger.js';
import {
  AppError,
  NotFoundError,
  ConflictError,
} from '../middleware/error.middleware.js';

// Fetches an organizer application with basic validation.
async function getPendingApplication(applicationId: string) {
  const application = await db
    .select()
    .from(organizerApplications)
    .where(eq(organizerApplications.id, applicationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!application) {
    throw new NotFoundError('Application not found');
  }

  if (application.status !== 'pending') {
    throw new ConflictError(
      `Application is already ${application.status} and cannot be processed.`
    );
  }

  return application;
}

// Fetches applicant user details (email + fullName).
async function getApplicant(userId: string) {
  const applicant = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!applicant) {
    throw new NotFoundError('Applicant user not found');
  }

  return applicant;
}

// Decrypts bank account number safely.
async function decryptBankAccount(encrypted: string): Promise<string> {
  try {
    return decrypt(encrypted);
  } catch {
    throw new AppError(
      500,
      'Failed to decrypt bank account details. Please contact support.'
    );
  }
}

// Creates Paystack subaccount and returns required data.
async function createOrganizerSubaccount(
  application: any,
  organizerPercent: number
): Promise<{ subaccount_code: string; id: number }> {
  let decryptedAccountNumber: string;
  try {
    decryptedAccountNumber = await decryptBankAccount(application.bankAccountNumber);
  } catch (err) {
    logger.error('Bank decryption failed during subaccount creation', { applicationId: application.id });
    throw err; // rethrow the AppError from decrypt helper
  }

  try {
    return await createSubaccount(
      application.businessName,
      application.bankCode,
      decryptedAccountNumber,
      organizerPercent
    );
  } catch (err) {
    logger.error('Failed to create Paystack subaccount', {
      applicationId: application.id,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError(
      502,
      'Failed to create Paystack subaccount. Please try again or contact support.'
    );
  }
}

// Atomically updates DB after successful external calls (approval flow).
async function executeApprovalTransaction(
  applicationId: string,
  userId: string,
  reviewedBy: string,
  subaccountData: { subaccount_code: string; id: number },
  application: any
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update application
    await tx
      .update(organizerApplications)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizerApplications.id, applicationId));

    // Promote user role
    await tx
      .update(users)
      .set({ role: 'organizer', updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Create organizer profile
    await tx
      .insert(organizerProfiles)
      .values({
        userId,
        businessName: application.businessName,
        businessDescription: application.businessDescription ?? undefined,
        websiteUrl: application.websiteUrl ?? undefined,
        instagramHandle: application.instagramHandle ?? undefined,
        paystackSubaccountCode: subaccountData.subaccount_code,
        paystackSubaccountId: String(subaccountData.id),
        bankName: application.bankName,
        bankAccountNumber: maskAccountNumber(decrypt(application.bankAccountNumber)), // safe since we decrypted earlier
        bankAccountName: application.bankAccountName,
        status: 'approved',
        totalEventsCreated: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
      });
  });
}

// PUBLIC SERVICE FUNCTIONS 

/**
 * Approve an organizer application.
 * Steps: validate → external calls → atomic DB update → email.
 */
export async function approveApplication(
  applicationId: string,
  reviewedBy: string
): Promise<void> {
  const application = await getPendingApplication(applicationId);
  const applicant = await getApplicant(application.userId);

  // Platform fee settings
  const settings = await getSettings();
  const organizerPercent = 100 - settings.service_fee_percent;

  // External Paystack call (non-transactional)
  const subaccountData = await createOrganizerSubaccount(application, organizerPercent);

  // Atomic DB changes
  await executeApprovalTransaction(
    applicationId,
    application.userId,
    reviewedBy,
    subaccountData,
    application
  );

  // Side effect: email
  await enqueueOrganizerApprovedEmail({
    userId: application.userId,
    email: applicant.email,
    fullName: applicant.fullName,
    businessName: application.businessName,
  });

  logger.info('Organizer application approved', {
    applicationId,
    userId: application.userId,
    businessName: application.businessName,
    subaccountCode: subaccountData.subaccount_code,
    reviewedBy,
  });
}

export async function rejectApplication(
  applicationId: string,
  reviewedBy: string,
  rejectionReason: string
): Promise<void> {
  const application = await getPendingApplication(applicationId);
  const applicant = await getApplicant(application.userId);

  await db
    .update(organizerApplications)
    .set({
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(organizerApplications.id, applicationId));

  await enqueueOrganizerRejectedEmail({
    userId: application.userId,
    email: applicant.email,
    fullName: applicant.fullName,
    businessName: application.businessName,
    rejectionReason,
  });

  logger.info('Organizer application rejected', {
    applicationId,
    userId: application.userId,
    reviewedBy,
    rejectionReason,
  });
}

/**
 * Suspend a user (with organizer profile sync).
 */
export async function suspendUser(
  userId: string,
  reason: string,
  adminId: string
): Promise<void> {
  const user = await db
    .select({
      role: users.role,
      email: users.email,
      fullName: users.fullName,
      isSuspended: users.isSuspended,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) throw new NotFoundError('User not found');
  if (user.isSuspended) throw new ConflictError('User is already suspended');

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    if (user.role === 'organizer') {
      await tx
        .update(organizerProfiles)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(eq(organizerProfiles.userId, userId));
    }
  });

  if (user.role === 'organizer') {
    const profile = await db
      .select({ businessName: organizerProfiles.businessName })
      .from(organizerProfiles)
      .where(eq(organizerProfiles.userId, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (profile) {
      await enqueueOrganizerSuspendedEmail({
        userId,
        email: user.email,
        fullName: user.fullName,
        businessName: profile.businessName,
        reason,
      });
    }
    // PHASE 7: enqueue unpublish job
  }

  logger.info('User suspended', { userId, adminId, reason, role: user.role });
}

/**
 * Unsuspend a user (with organizer profile sync).
 */
export async function unsuspendUser(
  userId: string,
  adminId: string
): Promise<void> {
  const user = await db
    .select({ role: users.role, isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) throw new NotFoundError('User not found');
  if (!user.isSuspended) throw new ConflictError('User is not suspended');

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    if (user.role === 'organizer') {
      await tx
        .update(organizerProfiles)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(organizerProfiles.userId, userId));
    }
  });

  logger.info('User unsuspended', { userId, adminId });
}
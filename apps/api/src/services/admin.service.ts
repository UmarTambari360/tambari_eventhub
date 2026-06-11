import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  organizerApplications,
  organizerProfiles,
  users,
} from '../db/schema/index.js';
import { decrypt, maskAccountNumber } from '../utils/encryption.js';
import {
  createSubaccount,
} from './paystack.service.js';
import { getSettings } from './platform.service.js';
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

/**
 * Approve an organizer application.
 * Steps:
 *   1. Fetch the application and decrypt the bank account number.
 *   2. Create a Paystack subaccount for the organizer.
 *   3. Create the organizer_profiles row.
 *   4. Update application status → approved.
 *   5. Update user role → organizer.
 *   6. Enqueue approval email.
 *
 * This runs in a DB transaction where possible, but Paystack API call
 * is external — if subaccount creation fails the DB stays unchanged.
 */
export async function approveApplication(
  applicationId: string,
  reviewedBy: string
): Promise<void> {
  // Fetch application
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
      `Application is already ${application.status} and cannot be approved.`
    );
  }

  // Fetch the applicant
  const applicant = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, application.userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!applicant) {
    throw new NotFoundError('Applicant user not found');
  }

  // Decrypt bank account number for Paystack subaccount creation
  let decryptedAccountNumber: string;
  try {
    decryptedAccountNumber = decrypt(application.bankAccountNumber);
  } catch {
    throw new AppError(
      500,
      'Failed to decrypt bank account details. Please contact support.'
    );
  }

  // Get current service fee percent from platform settings
  const settings = await getSettings();
  const organizerPercent = 100 - settings.service_fee_percent;

  // Create Paystack subaccount
  let subaccountData: { subaccount_code: string; id: number };
  try {
    subaccountData = await createSubaccount(
      application.businessName,
      application.bankCode,
      decryptedAccountNumber,
      organizerPercent
    );
  } catch (err) {
    logger.error('Failed to create Paystack subaccount during approval', {
      applicationId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError(
      502,
      'Failed to create Paystack subaccount. Please try again or contact support.'
    );
  }

  // All external calls succeeded — update DB atomically
  await db.transaction(async (tx) => {
    // Update application status
    await tx
      .update(organizerApplications)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizerApplications.id, applicationId));

    // Update user role to organizer
    await tx
      .update(users)
      .set({ role: 'organizer', updatedAt: new Date() })
      .where(eq(users.id, application.userId));

    // Create organizer profile
    await tx
      .insert(organizerProfiles)
      .values({
        userId: application.userId,
        businessName: application.businessName,
        businessDescription: application.businessDescription ?? undefined,
        websiteUrl: application.websiteUrl ?? undefined,
        instagramHandle: application.instagramHandle ?? undefined,
        paystackSubaccountCode: subaccountData.subaccount_code,
        paystackSubaccountId: String(subaccountData.id),
        bankName: application.bankName,
        bankAccountNumber: maskAccountNumber(decryptedAccountNumber),
        bankAccountName: application.bankAccountName,
        status: 'approved',
        totalEventsCreated: 0,
        totalTicketsSold: 0,
        totalRevenue: 0,
      });
  });

  // Enqueue approval email
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

/**
 * Reject an organizer application.
 */
export async function rejectApplication(
  applicationId: string,
  reviewedBy: string,
  rejectionReason: string
): Promise<void> {
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
      `Application is already ${application.status} and cannot be rejected.`
    );
  }

  const applicant = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, application.userId))
    .limit(1)
    .then((rows) => rows[0]);

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

  if (applicant) {
    await enqueueOrganizerRejectedEmail({
      userId: application.userId,
      email: applicant.email,
      fullName: applicant.fullName,
      businessName: application.businessName,
      rejectionReason,
    });
  }

  logger.info('Organizer application rejected', {
    applicationId,
    userId: application.userId,
    reviewedBy,
    rejectionReason,
  });
}

/**
 * Suspend a user.
 * For organizers: also updates their organizer_profiles.status to suspended.
 * Enqueueing the unpublish job happens in Phase 7 when event management exists.
 */
export async function suspendUser(
  userId: string,
  reason: string,
  adminId: string
): Promise<void> {
  const user = await db
    .select({ role: users.role, email: users.email, fullName: users.fullName, isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isSuspended) {
    throw new ConflictError('User is already suspended');
  }

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

    // If organizer, suspend their profile too
    if (user.role === 'organizer') {
      await tx
        .update(organizerProfiles)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(eq(organizerProfiles.userId, userId));
    }
  });

  if (user.role === 'organizer') {
    // Get business name for the email
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

    // PHASE 7: enqueue unpublish-suspended-organizer-events cleanup job
  }

  logger.info('User suspended', { userId, adminId, reason, role: user.role });
}

/**
 * Unsuspend a user.
 * Does NOT auto-republish organizer events — organizer must do that manually.
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

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isSuspended) {
    throw new ConflictError('User is not suspended');
  }

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
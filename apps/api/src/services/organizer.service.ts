import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  organizerApplications,
  organizerProfiles,
  users,
} from '../db/schema/index.js';
import { encrypt, maskAccountNumber } from '../utils/encryption.js';
import { logger } from '../lib/logger.js';
import {
  enqueueOrganizerApplicationReceivedEmail,
} from '../jobs/producers/email.producer.js';
import {
  AppError,
  ConflictError,
  NotFoundError,
} from '../middleware/error.middleware.js';

export interface SubmitApplicationInput {
  userId: string;
  businessName: string;
  businessDescription: string;
  websiteUrl?: string;
  instagramHandle?: string;
  bankName: string;
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

// INTERNAL HELPERS 

// Checks for existing organizer application and enforces business rules.
async function checkForExistingApplication(userId: string): Promise<void> {
  const existing = await db
    .select({ id: organizerApplications.id, status: organizerApplications.status })
    .from(organizerApplications)
    .where(eq(organizerApplications.userId, userId))
    .limit(1);

  if (existing.length === 0) return;

  const app = existing[0]!;

  if (app.status === 'pending') {
    throw new ConflictError(
      'You already have a pending application. Please wait for our team to review it.'
    );
  }

  if (app.status === 'approved') {
    throw new ConflictError(
      'Your application has already been approved. Please access your organizer dashboard.'
    );
  }

  // Rejected users are allowed to re-apply
}

// Fetches user details needed for email and application.
async function getUserForApplication(userId: string) {
  const user = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

// Maps raw application row to admin-friendly response shape.
function mapApplicationForAdmin(row: any) {
  return {
    id: row.id,
    businessName: row.businessName,
    businessDescription: row.businessDescription,
    websiteUrl: row.websiteUrl,
    instagramHandle: row.instagramHandle,
    bankName: row.bankName,
    bankAccountName: row.bankAccountName,
    status: row.status,
    createdAt: row.createdAt,
    rejectionReason: row.rejectionReason,
    user: {
      id: row.userId,
      email: row.userEmail,
      fullName: row.userFullName,
    },
  };
}

// PUBLIC SERVICE FUNCTIONS

//Submit an organizer application.
//A user can only have one pending/approved application at a time.
export async function submitApplication(
  input: SubmitApplicationInput
): Promise<typeof organizerApplications.$inferSelect> {
  const {
    userId,
    businessName,
    businessDescription,
    websiteUrl,
    instagramHandle,
    bankName,
    bankCode,
    bankAccountNumber,
    bankAccountName,
  } = input;

  await checkForExistingApplication(userId);

  const user = await getUserForApplication(userId);

  // Encrypt sensitive bank details
  const encryptedAccountNumber = encrypt(bankAccountNumber);

  const [application] = await db
    .insert(organizerApplications)
    .values({
      userId,
      businessName,
      businessDescription,
      websiteUrl,
      instagramHandle,
      bankName,
      bankCode,
      bankAccountNumber: encryptedAccountNumber,
      bankAccountName,
      status: 'pending',
    })
    .returning();

  if (!application) {
    throw new AppError(500, 'Failed to create application');
  }

  // Notify applicant
  await enqueueOrganizerApplicationReceivedEmail({
    userId,
    email: user.email,
    fullName: user.fullName,
    businessName,
  });

  logger.info('Organizer application submitted', {
    applicationId: application.id,
    userId,
    businessName,
  });

  return application;
}

//Get the current user's application status.
export async function getApplicationStatus(userId: string): Promise<{
  status: string;
  businessName: string;
  submittedAt: Date;
  rejectionReason: string | null;
} | null> {
  const application = await db
    .select({
      status: organizerApplications.status,
      businessName: organizerApplications.businessName,
      submittedAt: organizerApplications.createdAt,
      rejectionReason: organizerApplications.rejectionReason,
    })
    .from(organizerApplications)
    .where(eq(organizerApplications.userId, userId))
    .orderBy(organizerApplications.createdAt)
    .limit(1)
    .then((rows) => rows[0]);

  return application ?? null;
}

//Get the organizer profile for a user.
//Always returns masked bank account number.
export async function getOrganizerProfile(userId: string) {
  const profile = await db
    .select()
    .from(organizerProfiles)
    .where(eq(organizerProfiles.userId, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!profile) return null;

  return {
    ...profile,
    bankAccountNumber: profile.bankAccountNumber
      ? maskAccountNumber(profile.bankAccountNumber)
      : null,
  };
}

//Get all organizer applications for admin review (paginated).
export async function listApplicationsForAdmin(
  status?: 'pending' | 'approved' | 'rejected',
  page = 1,
  limit = 20
): Promise<{
  applications: Array<{
    id: string;
    businessName: string;
    businessDescription: string;
    websiteUrl: string | null;
    instagramHandle: string | null;
    bankName: string;
    bankAccountName: string;
    status: string;
    createdAt: Date;
    user: { id: string; email: string; fullName: string };
  }>;
  total: number;
}> {
  const offset = (page - 1) * limit;

  const conditions = status
    ? and(eq(organizerApplications.status, status))
    : undefined;

  const [applicationRows, countResult] = await Promise.all([
    db
      .select({
        id: organizerApplications.id,
        businessName: organizerApplications.businessName,
        businessDescription: organizerApplications.businessDescription,
        websiteUrl: organizerApplications.websiteUrl,
        instagramHandle: organizerApplications.instagramHandle,
        bankName: organizerApplications.bankName,
        bankCode: organizerApplications.bankCode,
        bankAccountName: organizerApplications.bankAccountName,
        status: organizerApplications.status,
        createdAt: organizerApplications.createdAt,
        rejectionReason: organizerApplications.rejectionReason,
        userId: users.id,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(organizerApplications)
      .innerJoin(users, eq(organizerApplications.userId, users.id))
      .where(conditions)
      .orderBy(organizerApplications.createdAt)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: organizerApplications.id })
      .from(organizerApplications)
      .where(conditions),
  ]);

  return {
    applications: applicationRows.map(mapApplicationForAdmin),
    total: countResult.length,
  };
}

//Get a single application by ID for admin review.
//Never exposes encrypted bank details.
export async function getApplicationByIdForAdmin(applicationId: string) {
  const row = await db
    .select({
      id: organizerApplications.id,
      businessName: organizerApplications.businessName,
      businessDescription: organizerApplications.businessDescription,
      websiteUrl: organizerApplications.websiteUrl,
      instagramHandle: organizerApplications.instagramHandle,
      bankName: organizerApplications.bankName,
      bankCode: organizerApplications.bankCode,
      bankAccountName: organizerApplications.bankAccountName,
      status: organizerApplications.status,
      rejectionReason: organizerApplications.rejectionReason,
      createdAt: organizerApplications.createdAt,
      reviewedAt: organizerApplications.reviewedAt,
      userId: users.id,
      userEmail: users.email,
      userFullName: users.fullName,
      userCreatedAt: users.createdAt,
    })
    .from(organizerApplications)
    .innerJoin(users, eq(organizerApplications.userId, users.id))
    .where(eq(organizerApplications.id, applicationId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) return null;

  return {
    id: row.id,
    businessName: row.businessName,
    businessDescription: row.businessDescription,
    websiteUrl: row.websiteUrl,
    instagramHandle: row.instagramHandle,
    bankName: row.bankName,
    bankCode: row.bankCode,
    bankAccountName: row.bankAccountName,
    status: row.status,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    user: {
      id: row.userId,
      email: row.userEmail,
      fullName: row.userFullName,
      memberSince: row.userCreatedAt,
    },
  };
}
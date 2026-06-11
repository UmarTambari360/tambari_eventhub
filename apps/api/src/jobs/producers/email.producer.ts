import { emailQueue, EMAIL_JOBS } from '../queues';

export interface WelcomeEmailPayload {
  userId: string;
  email: string;
  fullName: string;
}

export interface OrganizerApplicationReceivedPayload {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
}

export interface OrganizerApprovedPayload {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
}

export interface OrganizerRejectedPayload {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
  rejectionReason: string;
}

export interface OrganizerSuspendedPayload {
  userId: string;
  email: string;
  fullName: string;
  businessName: string;
  reason: string;
}

export async function enqueueWelcomeEmail(
  payload: WelcomeEmailPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.WELCOME, payload);
}

export async function enqueueOrganizerApplicationReceivedEmail(
  payload: OrganizerApplicationReceivedPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.ORGANIZER_APPLICATION_RECEIVED, payload);
}

export async function enqueueOrganizerApprovedEmail(
  payload: OrganizerApprovedPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.ORGANIZER_APPROVED, payload);
}

export async function enqueueOrganizerRejectedEmail(
  payload: OrganizerRejectedPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.ORGANIZER_REJECTED, payload);
}

export async function enqueueOrganizerSuspendedEmail(
  payload: OrganizerSuspendedPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.ORGANIZER_SUSPENDED, payload);
}
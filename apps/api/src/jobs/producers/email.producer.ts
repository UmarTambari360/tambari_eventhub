import { emailQueue, EMAIL_JOBS } from '../queues.js';

// ─── Payload types ────────────────────────────────────────────────────────────

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

export interface OrderConfirmationPayload {
  to: string;
  customerName: string;
  orderNumber: string;
  eventTitle: string;
  eventDate: string; // pre-formatted
  eventVenue: string;
  eventLocation: string;
  items: Array<{
    ticketTypeName: string;
    quantity: number;
    pricePerTicket: number;
    subtotal: number;
  }>;
  subtotalKobo: number;
  serviceFeeKobo: number;
  totalAmountKobo: number;
  isFreeOrder: boolean;
}

export interface TicketDeliveryPayload {
  to: string;
  customerName: string;
  orderNumber: string;
  eventTitle: string;
  eventDate: string; // pre-formatted
  eventVenue: string;
  eventLocation: string;
  tickets: Array<{
    firstName: string;
    lastName: string;
    ticketCode: string;
    ticketTypeName: string;
    qrCodeUrl: string;
  }>;
}

export interface PaymentFailedPayload {
  to: string;
  customerName: string;
  eventTitle: string;
  orderNumber: string;
  failureReason?: string;
}

export interface EventReminderPayload {
  to: string;
  customerName: string;
  eventTitle: string;
  eventDate: string; // pre-formatted
  eventVenue: string;
  eventLocation: string;
  eventAddress?: string;
  orderNumber: string;
  ticketCount: number;
  hoursUntilEvent: number;
}

export interface RefundConfirmationPayload {
  to: string;
  customerName: string;
  eventTitle: string;
  orderNumber: string;
  refundAmountKobo: number;
  ticketCount: number;
}

// ─── Producers ────────────────────────────────────────────────────────────────

export async function enqueueWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
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

export async function enqueueOrderConfirmationEmail(
  payload: OrderConfirmationPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.ORDER_CONFIRMATION, payload);
}

export async function enqueueTicketDeliveryEmail(
  payload: TicketDeliveryPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.TICKET_DELIVERY, payload);
}

export async function enqueuePaymentFailedEmail(
  payload: PaymentFailedPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.PAYMENT_FAILED, payload);
}

export async function enqueueEventReminderEmail(
  payload: EventReminderPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.EVENT_REMINDER, payload);
}

export async function enqueueRefundConfirmationEmail(
  payload: RefundConfirmationPayload
): Promise<void> {
  await emailQueue.add(EMAIL_JOBS.REFUND_CONFIRMATION, payload);
}
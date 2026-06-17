import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface RefundConfirmationEmailProps {
  customerName: string;
  eventTitle: string;
  orderNumber: string;
  refundAmountKobo: number;
  ticketCount: number;
}

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export function RefundConfirmationEmail({
  customerName,
  eventTitle,
  orderNumber,
  refundAmountKobo,
  ticketCount,
}: RefundConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Refund processed for {eventTitle} — {formatNaira(refundAmountKobo)} will appear in your
        account
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Refund Processed ✅</Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your refund for <strong>{eventTitle}</strong> has been processed successfully.
          </Text>

          <Section style={refundBox}>
            <Text style={refundLabel}>Refund amount</Text>
            <Text style={refundAmount}>{formatNaira(refundAmountKobo)}</Text>
            <Text style={refundMeta}>
              Order: {orderNumber} · {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
            </Text>
          </Section>

          <Section style={timelineBox}>
            <Text style={timelineTitle}>When will I receive my refund?</Text>
            <Text style={timelineText}>
              Refunds are processed immediately on our end via Paystack. Depending on your bank and
              payment method, funds typically appear within:
            </Text>
            <Text style={timelineItem}>• Debit/Credit card: 5–10 business days</Text>
            <Text style={timelineItem}>• Bank transfer: 2–5 business days</Text>
            <Text style={timelineText}>
              Your tickets for this event have been cancelled and your QR codes are no longer valid.
            </Text>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Have questions about your refund? Contact us at{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>{' '}
            and reference order {orderNumber}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default RefundConfirmationEmail;

const main: React.CSSProperties = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '580px',
  borderRadius: '8px',
};
const h1: React.CSSProperties = {
  color: '#1a1a2e',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 24px',
};
const text: React.CSSProperties = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};
const refundBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};
const refundLabel: React.CSSProperties = {
  color: '#166534',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: '0 0 6px',
};
const refundAmount: React.CSSProperties = {
  color: '#166534',
  fontSize: '32px',
  fontWeight: '800',
  margin: '0 0 8px',
};
const refundMeta: React.CSSProperties = {
  color: '#15803d',
  fontSize: '12px',
  fontFamily: 'monospace',
  margin: '0',
};
const timelineBox: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const timelineTitle: React.CSSProperties = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};
const timelineText: React.CSSProperties = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 10px',
};
const timelineItem: React.CSSProperties = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 4px',
};
const hr: React.CSSProperties = { borderColor: '#e5e7eb', margin: '28px 0' };
const footer: React.CSSProperties = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link: React.CSSProperties = { color: '#7c3aed', textDecoration: 'underline' };

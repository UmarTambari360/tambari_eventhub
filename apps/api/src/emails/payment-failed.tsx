import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PaymentFailedEmailProps {
  customerName: string;
  eventTitle: string;
  orderNumber: string;
  failureReason?: string;
}

export function PaymentFailedEmail({
  customerName,
  eventTitle,
  orderNumber,
  failureReason,
}: PaymentFailedEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>Payment unsuccessful for {eventTitle} — no charge was made</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Unsuccessful ❌</Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Unfortunately, your payment for <strong>{eventTitle}</strong> could not be processed. No
            charge has been made to your account.
          </Text>

          <Section style={errorBox}>
            <Text style={errorLabel}>Order reference</Text>
            <Text style={errorValue}>{orderNumber}</Text>
            {failureReason && (
              <>
                <Text style={errorLabel}>Reason</Text>
                <Text style={errorValue}>{failureReason}</Text>
              </>
            )}
          </Section>

          <Text style={text}>
            <strong>What to do next:</strong>
          </Text>
          <Text style={listItem}>• Check that your card details are correct</Text>
          <Text style={listItem}>• Ensure you have sufficient funds available</Text>
          <Text style={listItem}>• Try a different card or payment method</Text>
          <Text style={listItem}>• Contact your bank if the issue persists</Text>

          <Text style={text}>
            Tickets for this event may still be available. You can try again by returning to the
            event page.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/events`}>
              Browse Events
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Need help?{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentFailedEmail;

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
  margin: '0 0 12px',
};
const errorBox: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const errorLabel: React.CSSProperties = {
  color: '#991b1b',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: '0 0 2px',
};
const errorValue: React.CSSProperties = {
  color: '#7f1d1d',
  fontSize: '14px',
  fontFamily: 'monospace',
  margin: '0 0 12px',
};
const listItem: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 4px',
  paddingLeft: '4px',
};
const buttonContainer: React.CSSProperties = { margin: '28px 0' };
const button: React.CSSProperties = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};
const hr: React.CSSProperties = { borderColor: '#e5e7eb', margin: '28px 0' };
const footer: React.CSSProperties = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link: React.CSSProperties = { color: '#7c3aed', textDecoration: 'underline' };

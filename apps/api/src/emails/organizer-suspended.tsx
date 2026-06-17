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

interface OrganizerSuspendedEmailProps {
  fullName: string;
  businessName: string;
  reason: string;
}

export function OrganizerSuspendedEmail({
  fullName,
  businessName,
  reason,
}: OrganizerSuspendedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Important update regarding your EventHub organizer account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Account Suspended</Heading>

          <Text style={text}>Hi {fullName},</Text>
          <Text style={text}>
            Your EventHub organizer account for <strong>{businessName}</strong> has been suspended.
            As a result, your published events have been unpublished and ticket sales have been
            paused.
          </Text>

          <Section style={reasonBox}>
            <Text style={reasonLabel}>Reason for suspension</Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>

          <Text style={text}>
            <strong>What this means:</strong>
          </Text>
          <Text style={listItem}>
            • All your published events have been temporarily unpublished
          </Text>
          <Text style={listItem}>• Ticket sales for your events are paused</Text>
          <Text style={listItem}>
            • Existing ticket holders are not affected — their tickets remain valid unless the
            events are cancelled
          </Text>
          <Text style={listItem}>• You cannot create or publish new events while suspended</Text>

          <Text style={text}>
            If you believe this suspension was made in error or would like to appeal, please contact
            our support team with your business name and the order reference number.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Contact us at{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>{' '}
            — please reference your business name: <strong>{businessName}</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrganizerSuspendedEmail;

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
const reasonBox: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const reasonLabel: React.CSSProperties = {
  color: '#991b1b',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  margin: '0 0 6px',
};
const reasonText: React.CSSProperties = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};
const listItem: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 6px',
};
const hr: React.CSSProperties = { borderColor: '#e5e7eb', margin: '28px 0' };
const footer: React.CSSProperties = { color: '#6b7280', fontSize: '13px', lineHeight: '20px' };
const link: React.CSSProperties = { color: '#7c3aed', textDecoration: 'underline' };

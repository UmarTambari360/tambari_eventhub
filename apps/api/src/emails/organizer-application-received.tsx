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

interface OrganizerApplicationReceivedEmailProps {
  fullName: string;
  businessName: string;
}

export function OrganizerApplicationReceivedEmail({
  fullName,
  businessName,
}: OrganizerApplicationReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We've received your organizer application for {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Received ✅</Heading>
          <Text style={text}>Hi {fullName},</Text>
          <Text style={text}>
            Thank you for applying to become an organizer on EventHub. We've received your
            application for <strong>{businessName}</strong> and our team is reviewing it now.
          </Text>
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>What happens next?</strong>
            </Text>
            <Text style={infoText}>
              1. Our team will review your application within 2–3 business days.
            </Text>
            <Text style={infoText}>2. We'll verify your bank account details with Paystack.</Text>
            <Text style={infoText}>3. You'll receive an email with our decision.</Text>
          </Section>
          <Text style={text}>
            If your application is approved, you'll be able to create and publish events immediately
            — and your ticket revenue will be paid directly to your bank account via Paystack.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Questions? Reply to this email or contact{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrganizerApplicationReceivedEmail;

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
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 24px',
};

const text: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const infoBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
  padding: '20px',
  margin: '24px 0',
};

const infoText: React.CSSProperties = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 8px',
};

const hr: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
};

const link: React.CSSProperties = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

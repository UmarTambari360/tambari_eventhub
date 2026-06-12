import * as React from 'react';
import { 
    Body, 
    Container, 
    Head, 
    Heading, 
    Hr, Html, 
    Preview, Text } from '@react-email/components';

interface OrganizerRejectedEmailProps {
  fullName: string;
  businessName: string;
  rejectionReason: string;
}

export function OrganizerRejectedEmail({
  fullName,
  businessName,
  rejectionReason,
}: OrganizerRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your organizer application for {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Update</Heading>
          <Text style={text}>Hi {fullName},</Text>
          <Text style={text}>
            Thank you for applying to become an organizer on EventHub. After reviewing your
            application for <strong>{businessName}</strong>, we're unable to approve it at this
            time.
          </Text>
          <Text style={label}>Reason:</Text>
          <Text style={reasonBox}>{rejectionReason}</Text>
          <Text style={text}>
            You're welcome to submit a new application once you've addressed the points above. If
            you believe this decision was made in error or need clarification, please contact our
            support team.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Contact us at{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrganizerRejectedEmail;

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

const label: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const reasonBox: React.CSSProperties = {
  backgroundColor: '#fef2f2',
  borderRadius: '6px',
  border: '1px solid #fecaca',
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '16px',
  margin: '0 0 24px',
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

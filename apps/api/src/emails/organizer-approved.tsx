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

interface OrganizerApprovedEmailProps {
  fullName: string;
  businessName: string;
}

export function OrganizerApprovedEmail({ fullName, businessName }: OrganizerApprovedEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>
        Congratulations! Your organizer application for {businessName} has been approved.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're Approved! 🎊</Heading>
          <Text style={text}>Hi {fullName},</Text>
          <Text style={text}>
            Great news! Your organizer application for <strong>{businessName}</strong> has been
            approved. You can now create and publish events on EventHub.
          </Text>
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>What you can do now:</strong>
            </Text>
            <Text style={infoText}>• Create and publish events</Text>
            <Text style={infoText}>• Set up ticket types with flexible pricing</Text>
            <Text style={infoText}>• Track attendees and manage check-ins</Text>
            <Text style={infoText}>
              • Receive ticket revenue directly in your bank account via Paystack
            </Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/dashboard`}>
              Go to Organizer Dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Need help getting started? Check out our organizer guide or contact{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrganizerApprovedEmail;

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

const buttonContainer: React.CSSProperties = {
  margin: '32px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#7c3aed',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
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

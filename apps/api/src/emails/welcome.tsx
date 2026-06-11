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

interface WelcomeEmailProps {
  fullName: string;
}

export function WelcomeEmail({ fullName }: WelcomeEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>Welcome to EventHub — your gateway to amazing events in Nigeria</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to EventHub 🎉</Heading>
          <Text style={text}>Hi {fullName},</Text>
          <Text style={text}>
            We're thrilled to have you on EventHub — Nigeria's premier event ticketing platform.
            Discover and book tickets to the best music festivals, tech conferences, art
            exhibitions, and more.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/events`}>
              Explore Events
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Want to host your own event?{' '}
            <a href={`${frontendUrl}/become-an-organizer`} style={link}>
              Apply to become an organizer
            </a>
            .
          </Text>
          <Text style={footer}>
            Questions? Reach us at{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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
  margin: '0 0 8px',
};

const link: React.CSSProperties = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

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

interface EventReminderEmailProps {
  customerName: string;
  eventTitle: string;
  eventDate: string; // pre-formatted full date + time
  eventVenue: string;
  eventLocation: string;
  eventAddress?: string;
  orderNumber: string;
  ticketCount: number;
  hoursUntilEvent: number; // 24 or 2
}

export function EventReminderEmail({
  customerName,
  eventTitle,
  eventDate,
  eventVenue,
  eventLocation,
  eventAddress,
  orderNumber,
  ticketCount,
  hoursUntilEvent,
}: EventReminderEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';
  const is24hr = hoursUntilEvent >= 20;

  return (
    <Html>
      <Head />
      <Preview>
        {is24hr ? `${eventTitle} is tomorrow!` : `${eventTitle} starts in ${hoursUntilEvent} hours!`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {is24hr ? "Tomorrow's the Big Day! 🎉" : "It's Almost Time! ⏰"}
          </Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            {is24hr
              ? `Just a reminder that ${eventTitle} is tomorrow. Get ready!`
              : `${eventTitle} starts in about ${hoursUntilEvent} hours. Time to head out!`}
          </Text>

          <Section style={eventBox}>
            <Text style={eventName}>{eventTitle}</Text>
            <Text style={eventMeta}>📅 {eventDate}</Text>
            <Text style={eventMeta}>
              📍 {eventVenue}, {eventLocation}
            </Text>
            {eventAddress && <Text style={addressText}>{eventAddress}</Text>}
            {eventAddress && (
              <Text style={mapsLink}>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(eventAddress)}`}
                  style={link}
                >
                  View on Google Maps →
                </a>
              </Text>
            )}
            <Text style={orderRef}>
              Order: {orderNumber} · {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
            </Text>
          </Section>

          <Section style={tipsBox}>
            <Text style={tipsTitle}>What to bring</Text>
            <Text style={tip}>✓ Your QR code tickets (in your email or the EventHub app)</Text>
            <Text style={tip}>✓ A valid ID</Text>
            <Text style={tip}>✓ Your phone charged and ready for scanning</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/my-tickets`}>
              View My Tickets
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            See you there! Questions?{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default EventReminderEmail;

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
const eventBox: React.CSSProperties = {
  backgroundColor: '#f5f3ff',
  borderRadius: '8px',
  border: '1px solid #ddd6fe',
  padding: '20px',
  margin: '24px 0',
};
const eventName: React.CSSProperties = {
  color: '#4c1d95',
  fontSize: '17px',
  fontWeight: '700',
  margin: '0 0 8px',
};
const eventMeta: React.CSSProperties = {
  color: '#5b21b6',
  fontSize: '14px',
  margin: '0 0 4px',
};
const addressText: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '13px',
  margin: '4px 0 2px',
};
const mapsLink: React.CSSProperties = { margin: '4px 0 0' };
const orderRef: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '600',
  margin: '12px 0 0',
  fontFamily: 'monospace',
};
const tipsBox: React.CSSProperties = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const tipsTitle: React.CSSProperties = {
  color: '#166534',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 10px',
};
const tip: React.CSSProperties = {
  color: '#166534',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 6px',
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
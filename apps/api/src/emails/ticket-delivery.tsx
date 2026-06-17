import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface AttendeeTicket {
  firstName: string;
  lastName: string;
  ticketCode: string;
  ticketTypeName: string;
  qrCodeUrl: string;
}

interface TicketDeliveryEmailProps {
  customerName: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  eventLocation: string;
  orderNumber: string;
  tickets: AttendeeTicket[];
}

export function TicketDeliveryEmail({
  customerName,
  eventTitle,
  eventDate,
  eventVenue,
  eventLocation,
  orderNumber,
  tickets,
}: TicketDeliveryEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>Your QR code tickets for {eventTitle} are ready — show them at the door!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Tickets Are Ready! 🎟️</Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Here are your QR code tickets for <strong>{eventTitle}</strong>. Show the QR code at the
            entrance to check in. One QR code per ticket — do not share these.
          </Text>

          {/* Event summary */}
          <Section style={eventBox}>
            <Text style={eventName}>{eventTitle}</Text>
            <Text style={eventMeta}>📅 {eventDate}</Text>
            <Text style={eventMeta}>
              📍 {eventVenue}, {eventLocation}
            </Text>
            <Text style={orderRef}>Order: {orderNumber}</Text>
          </Section>

          {/* Tickets */}
          {tickets.map((ticket, i) => (
            <Section key={i} style={ticketCard}>
              <Text style={ticketHolder}>
                {ticket.firstName} {ticket.lastName}
              </Text>
              <Text style={ticketType}>{ticket.ticketTypeName}</Text>
              <Text style={ticketCode}>{ticket.ticketCode}</Text>
              {ticket.qrCodeUrl && (
                <Img
                  src={ticket.qrCodeUrl}
                  alt={`QR code for ticket ${ticket.ticketCode}`}
                  width={160}
                  height={160}
                  style={qrImage}
                />
              )}
            </Section>
          ))}

          <Text style={warningText}>
            ⚠️ These QR codes are unique and single-use. Each code can only be scanned once at the
            event entrance. Keep them secure.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/my-tickets`}>
              View All My Tickets
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            See you at the event! Questions?{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TicketDeliveryEmail;

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
const orderRef: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '12px',
  fontWeight: '600',
  margin: '12px 0 0',
  fontFamily: 'monospace',
};
const ticketCard: React.CSSProperties = {
  backgroundColor: '#fafafa',
  border: '1.5px dashed #d1d5db',
  borderRadius: '10px',
  padding: '20px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};
const ticketHolder: React.CSSProperties = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '700',
  margin: '0 0 4px',
};
const ticketType: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 8px',
};
const ticketCode: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '12px',
  fontFamily: 'monospace',
  letterSpacing: '0.05em',
  margin: '0 0 16px',
};
const qrImage: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
  borderRadius: '8px',
};
const warningText: React.CSSProperties = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '20px',
  padding: '12px 16px',
  margin: '16px 0',
};
const buttonContainer: React.CSSProperties = { margin: '24px 0' };
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

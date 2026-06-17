import * as React from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface OrderItem {
  ticketTypeName: string;
  quantity: number;
  pricePerTicket: number; // kobo
  subtotal: number; // kobo
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  eventTitle: string;
  eventDate: string; // pre-formatted
  eventVenue: string;
  eventLocation: string;
  items: OrderItem[];
  subtotalKobo: number;
  serviceFeeKobo: number;
  totalAmountKobo: number;
  isFreeOrder: boolean;
}

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  eventTitle,
  eventDate,
  eventVenue,
  eventLocation,
  items,
  subtotalKobo,
  serviceFeeKobo,
  totalAmountKobo,
  isFreeOrder,
}: OrderConfirmationEmailProps) {
  const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000';

  return (
    <Html>
      <Head />
      <Preview>
        Your {isFreeOrder ? 'registration' : 'tickets'} for {eventTitle} are confirmed!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isFreeOrder ? 'Registration Confirmed! 🎟️' : 'Payment Successful! 🎉'}
          </Heading>

          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            {isFreeOrder
              ? `You're registered for ${eventTitle}. Your spot is secured!`
              : `Your payment was successful and your tickets for ${eventTitle} are confirmed.`}
          </Text>

          {/* Event Info */}
          <Section style={eventBox}>
            <Text style={eventTitle_style}>{eventTitle}</Text>
            <Text style={eventMeta}>📅 {eventDate}</Text>
            <Text style={eventMeta}>
              📍 {eventVenue}, {eventLocation}
            </Text>
            <Text style={orderRef}>Order: {orderNumber}</Text>
          </Section>

          {/* Order Items */}
          <Section style={tableSection}>
            <Text style={sectionLabel}>Your Tickets</Text>
            {items.map((item, i) => (
              <Row key={i} style={tableRow}>
                <Column style={tableCell}>
                  <Text style={itemName}>
                    {item.ticketTypeName} × {item.quantity}
                  </Text>
                </Column>
                <Column style={tableCellRight}>
                  <Text style={itemPrice}>
                    {item.pricePerTicket === 0 ? 'FREE' : formatNaira(item.subtotal)}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={tableDivider} />

            {!isFreeOrder && serviceFeeKobo > 0 && (
              <Row style={tableRow}>
                <Column style={tableCell}>
                  <Text style={subtotalLabel}>Service fee</Text>
                </Column>
                <Column style={tableCellRight}>
                  <Text style={subtotalLabel}>{formatNaira(serviceFeeKobo)}</Text>
                </Column>
              </Row>
            )}

            <Row style={tableRow}>
              <Column style={tableCell}>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={tableCellRight}>
                <Text style={totalAmount}>
                  {isFreeOrder ? 'FREE' : formatNaira(totalAmountKobo)}
                </Text>
              </Column>
            </Row>
          </Section>

          <Text style={text}>
            Your QR code tickets will be delivered in a separate email shortly. You can also view
            your tickets anytime in your account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${frontendUrl}/my-tickets`}>
              View My Tickets
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Contact{' '}
            <a href="mailto:support@eventhub.ng" style={link}>
              support@eventhub.ng
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;

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
const eventTitle_style: React.CSSProperties = {
  color: '#4c1d95',
  fontSize: '18px',
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
const tableSection: React.CSSProperties = { margin: '24px 0' };
const sectionLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: '0 0 12px',
};
const tableRow: React.CSSProperties = { margin: '0 0 8px' };
const tableCell: React.CSSProperties = {};
const tableCellRight: React.CSSProperties = { textAlign: 'right' };
const itemName: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
};
const itemPrice: React.CSSProperties = {
  color: '#374151',
  fontSize: '14px',
  margin: '0',
};
const tableDivider: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
};
const subtotalLabel: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  margin: '0',
};
const totalLabel: React.CSSProperties = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0',
};
const totalAmount: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '15px',
  fontWeight: '700',
  margin: '0',
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
const footer: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
};
const link: React.CSSProperties = { color: '#7c3aed', textDecoration: 'underline' };

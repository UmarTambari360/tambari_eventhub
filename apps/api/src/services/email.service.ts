import { Resend } from 'resend';
import { logger } from '../lib/logger';
import type React from 'react';


let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env['RESEND_API_KEY'];
    if (!apiKey) throw new Error('RESEND_API_KEY is not set');
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getEmailFrom(): string {
  return process.env['EMAIL_FROM'] ?? 'EventHub <noreply@eventhub.ng>';
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}

//Send a transactional email via Resend.
//Throws on failure — callers (job workers) handle retries.
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, react } = options;

  const result = await getResend().emails.send({
    from: getEmailFrom(),
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
  });

  if (result.error) {
    logger.error('Resend email send failed', {
      to,
      subject,
      error: result.error.message,
    });
    throw new Error(`Email send failed: ${result.error.message}`);
  }

  logger.info('Email sent', { to, subject, id: result.data?.id });
}
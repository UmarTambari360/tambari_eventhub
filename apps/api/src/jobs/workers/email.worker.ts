import { Worker, type Job } from 'bullmq';
import React              from 'react';
import { getRedis }     from '../../lib/redis';
import { logger }     from '../../lib/logger';
import { sendEmail } from '../../services/email.service';
import { EMAIL_JOBS } from '../queues';
import type {
  WelcomeEmailPayload,
  OrganizerApplicationReceivedPayload,
  OrganizerApprovedPayload,
  OrganizerRejectedPayload,
  OrganizerSuspendedPayload,
}                       from '../producers/email.producer.js';
import { WelcomeEmail } from '../../emails/welcome';
import { OrganizerApplicationReceivedEmail } from '../../emails/organizer-application-received';
import { OrganizerApprovedEmail } from '../../emails/organizer-approved';
import { OrganizerRejectedEmail } from '../../emails/organizer-rejected';

// PHASE 8: import remaining email templates
// (OrganizerSuspended, OrderConfirmation, TicketDelivery, PaymentFailed, EventReminder, RefundConfirmation)

async function processEmailJob(job: Job): Promise<void> {
  const { name, data } = job;

  logger.info('Processing email job', { jobName: name, jobId: job.id });

  switch (name) {
    case EMAIL_JOBS.WELCOME: {
      const payload = data as WelcomeEmailPayload;
      await sendEmail({
        to: payload.email,
        subject: 'Welcome to EventHub 🎉',
        react: React.createElement(WelcomeEmail, { fullName: payload.fullName }),
      });
      break;
    }

    case EMAIL_JOBS.ORGANIZER_APPLICATION_RECEIVED: {
      const payload = data as OrganizerApplicationReceivedPayload;
      await sendEmail({
        to: payload.email,
        subject: 'We received your organizer application',
        react: React.createElement(OrganizerApplicationReceivedEmail, {
          fullName: payload.fullName,
          businessName: payload.businessName,
        }),
      });
      break;
    }

    case EMAIL_JOBS.ORGANIZER_APPROVED: {
      const payload = data as OrganizerApprovedPayload;
      await sendEmail({
        to: payload.email,
        subject: "You're approved as an EventHub organizer! 🎊",
        react: React.createElement(OrganizerApprovedEmail, {
          fullName: payload.fullName,
          businessName: payload.businessName,
        }),
      });
      break;
    }

    case EMAIL_JOBS.ORGANIZER_REJECTED: {
      const payload = data as OrganizerRejectedPayload;
      await sendEmail({
        to: payload.email,
        subject: 'Update on your EventHub organizer application',
        react: React.createElement(OrganizerRejectedEmail, {
          fullName: payload.fullName,
          businessName: payload.businessName,
          rejectionReason: payload.rejectionReason,
        }),
      });
      break;
    }

    case EMAIL_JOBS.ORGANIZER_SUSPENDED: {
      const payload = data as OrganizerSuspendedPayload;
      // PHASE 8: implement OrganizerSuspendedEmail template
      logger.warn('OrganizerSuspendedEmail template not yet implemented', {
        to: payload.email,
      });
      break;
    }

    // PHASE 8: implement remaining email jobs
    case EMAIL_JOBS.ORDER_CONFIRMATION:
    case EMAIL_JOBS.TICKET_DELIVERY:
    case EMAIL_JOBS.PAYMENT_FAILED:
    case EMAIL_JOBS.EVENT_REMINDER:
    case EMAIL_JOBS.REFUND_CONFIRMATION:
      logger.warn(`Email job ${name} not yet implemented in Phase 4`);
      break;

    default:
      logger.warn('Unknown email job', { jobName: name });
  }
}

export function createEmailWorker(): Worker {
  const worker = new Worker('email', processEmailJob, {
    connection: getRedis(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, error) => {
    logger.error('Email job failed', {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
      attempts: job?.attemptsMade,
    });
  });

  return worker;
}
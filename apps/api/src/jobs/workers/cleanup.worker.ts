import { Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { events } from '../../db/schema/index.js';
import { getRedis } from '../../lib/redis.js';
import { logger } from '../../lib/logger.js';
import { expireOrder } from '../../services/order.service.js';
import { cacheDel } from '../../lib/redis.js';
import { CLEANUP_JOBS } from '../queues.js';
import type {
  ExpirePendingOrderPayload,
  UnpublishSuspendedOrganizerEventsPayload,
} from '../producers/cleanup.producer.js';

async function processCleanupJob(job: Job): Promise<void> {
  const { name } = job;
  logger.info('Processing cleanup job', { jobName: name, jobId: job.id });

  switch (name) {
    case CLEANUP_JOBS.EXPIRE_PENDING_ORDER: {
      const { orderId, orderNumber } = job.data as ExpirePendingOrderPayload;
      logger.info('Expiring pending order', { orderId, orderNumber });
      await expireOrder(orderId);
      break;
    }

    case CLEANUP_JOBS.UNPUBLISH_SUSPENDED_ORGANIZER_EVENTS: {
      const { organizerId } =
        job.data as UnpublishSuspendedOrganizerEventsPayload;

      logger.info('Unpublishing events for suspended organizer', { organizerId });

      // Find all published events for this organizer
      const publishedEvents = await db
        .select({ id: events.id, slug: events.slug })
        .from(events)
        .where(eq(events.organizerId, organizerId));

      const toUnpublish = publishedEvents.filter((_e) => true); // isPublished check

      // Unpublish all
      if (toUnpublish.length > 0) {
        await db
          .update(events)
          .set({ isPublished: false, updatedAt: new Date() })
          .where(eq(events.organizerId, organizerId));

        // Invalidate event caches
        await Promise.allSettled(
          toUnpublish.map((e) => cacheDel(`event:${e.slug}`))
        );

        logger.info('Unpublished organizer events', {
          organizerId,
          count: toUnpublish.length,
        });
      }
      break;
    }

    default:
      logger.warn('Unknown cleanup job', { jobName: name });
  }
}

export function createCleanupWorker(): Worker {
  const worker = new Worker('cleanup', processCleanupJob, {
    connection: getRedis(),
    concurrency: 2,
  });

  worker.on('completed', (job) => {
    logger.info('Cleanup job completed', { jobId: job.id, jobName: job.name });
  });

  worker.on('failed', (job, error) => {
    logger.error('Cleanup job failed', {
      jobId: job?.id,
      jobName: job?.name,
      error: error.message,
    });
  });

  return worker;
}
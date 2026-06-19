/**
 * Bull Board UI — queue monitoring dashboard.
 * Mounted at /admin/queues, protected by admin role middleware in index.ts.
 *
 * Install required packages:
 *   pnpm --filter api add @bull-board/api @bull-board/express
 */
import { createBullBoard } from '@bull-board/api';
// Import BullMQAdapter without the .js extension so TypeScript can resolve types
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import {
  emailQueue,
  qrcodeQueue,
  webhookQueue,
  exportQueue,
  cleanupQueue,
} from '../jobs/queues.js';

export function createBullBoardRouter() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(qrcodeQueue),
      new BullMQAdapter(webhookQueue),
      new BullMQAdapter(exportQueue),
      new BullMQAdapter(cleanupQueue),
    ],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
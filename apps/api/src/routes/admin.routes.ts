import { Router } from 'express';
import type {
  Router as ExpressRouter,
  Request,
  Response,
  NextFunction,
} from 'express';
import {
  authenticate,
  requireRole,
} from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  approveApplication,
  rejectApplication,
  suspendUser,
  unsuspendUser,
} from '../services/admin.service.js';
import {
  listApplicationsForAdmin,
  getApplicationByIdForAdmin,
} from '../services/organizer.service.js';
import {
  getPlatformKPIs,
  getMonthlyRevenueChart,
  getTopOrganizers,
  getRecentTransactions,
  getRevenueBreakdown,
} from '../services/analytics.service.js';
import {
  queryAllUsers,
  queryUserDetail,
  queryAllEvents,
  queryAllOrders,
  queryOrderDetailForAdmin,
} from '../db/queries/admin.queries.js';
import { updateSetting } from '../services/platform.service.js';
import { getSettings } from '../services/platform.service.js';
import { refundOrder } from '../services/order.service.js';
import {
  rejectApplicationSchema,
  suspendUserSchema,
  updateSettingSchema,
} from '@eventhub/validators';
import { db } from '../db/index.js';
import { events } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router: ExpressRouter = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ─── Platform Analytics ───────────────────────────────────────────────────────

// GET /admin/analytics/kpis
router.get('/analytics/kpis', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kpis = await getPlatformKPIs();
    res.json({ success: true, data: kpis });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/revenue-chart
router.get('/analytics/revenue-chart', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(String(req.query['months'] ?? '12'), 10);
    const data = await getMonthlyRevenueChart(Math.min(24, Math.max(3, months)));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/top-organizers
router.get('/analytics/top-organizers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getTopOrganizers(10);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/recent-transactions
router.get('/analytics/recent-transactions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getRecentTransactions(20);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/revenue-breakdown
router.get('/analytics/revenue-breakdown', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getRevenueBreakdown();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── Organizer Applications ───────────────────────────────────────────────────

router.get('/applications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query['status'] as 'pending' | 'approved' | 'rejected' | undefined;
    const page = parseInt(String(req.query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);

    const result = await listApplicationsForAdmin(status, page, limit);

    res.json({
      success: true,
      data: result.applications,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/applications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const application = await getApplicationByIdForAdmin(id);

    if (!application) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Application not found' },
      });
      return;
    }

    res.json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
});

router.post('/applications/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await approveApplication(id, authReq.user.userId);

    res.json({
      success: true,
      data: null,
      message: 'Application approved. Organizer has been notified.',
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/applications/:id/reject',
  validate(rejectApplicationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      const { rejectionReason } = req.body as { rejectionReason: string };

      await rejectApplication(id, authReq.user.userId, rejectionReason);

      res.json({
        success: true,
        data: null,
        message: 'Application rejected. Applicant has been notified.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Users ────────────────────────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
    const role = req.query['role'] as string | undefined;
    const search = req.query['search'] as string | undefined;
    const isSuspended = req.query['suspended'] === 'true'
      ? true
      : req.query['suspended'] === 'false'
        ? false
        : undefined;

    const { rows, total } = await queryAllUsers(page, limit, {
      ...(role !== undefined && { role }),
      ...(isSuspended !== undefined && { isSuspended }),
      ...(search !== undefined && { search }),
    });

    res.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const detail = await queryUserDetail(id);

    if (!detail) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({ success: true, data: detail });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/users/:id/suspend',
  validate(suspendUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params as { id: string };
      const { reason } = req.body as { reason: string };

      if (id === authReq.user.userId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'You cannot suspend your own account' },
        });
        return;
      }

      await suspendUser(id, reason, authReq.user.userId);

      res.json({ success: true, data: null, message: 'User suspended successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/users/:id/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };

    await unsuspendUser(id, authReq.user.userId);

    res.json({ success: true, data: null, message: 'User unsuspended successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── Events ───────────────────────────────────────────────────────────────────

router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
    const search = req.query['search'] as string | undefined;
    const status = req.query['status'] as string | undefined;

    const filters: { isPublished?: boolean; isCancelled?: boolean; search?: string } = {};
    if (search) filters.search = search;
    if (status === 'published') { filters.isPublished = true; filters.isCancelled = false; }
    if (status === 'unpublished') { filters.isPublished = false; filters.isCancelled = false; }
    if (status === 'cancelled') filters.isCancelled = true;

    const { rows, total } = await queryAllEvents(page, limit, filters);

    res.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/events/:id/feature — toggle featured + featureOrder
router.post('/events/:id/feature', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const { isFeatured, featureOrder } = req.body as {
      isFeatured: boolean;
      featureOrder?: number | null;
    };

    await db
      .update(events)
      .set({ isFeatured, featureOrder: featureOrder ?? null, updatedAt: new Date() })
      .where(eq(events.id, id));

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// POST /admin/events/:id/unpublish
router.post('/admin/events/:id/unpublish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .update(events)
      .set({ isPublished: false, updatedAt: new Date() })
      .where(eq(events.id, id));
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// POST /admin/events/:id/cancel
router.post('/events/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await db
      .update(events)
      .set({ isCancelled: true, isPublished: false, updatedAt: new Date() })
      .where(eq(events.id, id));
    res.json({ success: true, data: null, message: 'Event cancelled.' });
  } catch (err) {
    next(err);
  }
});

// POST /admin/events/reorder — bulk update featureOrder
router.post('/events/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body as { items: Array<{ id: string; featureOrder: number }> };

    await Promise.all(
      items.map((item) =>
        db
          .update(events)
          .set({ featureOrder: item.featureOrder, updatedAt: new Date() })
          .where(eq(events.id, item.id))
      )
    );

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query['page'] ?? '1'), 10);
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 100);
    const status = req.query['status'] as string | undefined;
    const search = req.query['search'] as string | undefined;

    const { rows, total } = await queryAllOrders(page, limit, {
      ...(status && { status }),
      ...(search && { search }),
    });

    res.json({
      success: true,
      data: rows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const order = await queryOrderDetailForAdmin(id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

router.post('/orders/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    // const { reason } = req.body as { reason: string };

    await refundOrder(id, authReq.user.userId);

    res.json({ success: true, data: null, message: 'Refund initiated successfully.' });
  } catch (err) {
    next(err);
  }
});

// ─── Platform Settings ────────────────────────────────────────────────────────

router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/settings',
  validate(updateSettingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { key, value } = req.body as { key: string; value: string };

      await updateSetting(key, value, authReq.user.userId);

      res.json({ success: true, data: null, message: 'Setting updated.' });
    } catch (err) {
      next(err);
    }
  }
);

export { router as adminRouter };
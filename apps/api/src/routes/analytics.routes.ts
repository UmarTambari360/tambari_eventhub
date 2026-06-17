import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import {
  authenticate,
  requireRole,
  requireOrganizerApproved,
} from '../middleware/auth.middleware.js';
import {
  getOrganizerDashboardStats,
  getOrganizerMonthlyRevenue,
  getEventAnalytics,
  getEventOrdersForOrganizer,
  getEventAttendeesForOrganizer,
  getOrganizerOrderList,
} from '../services/analytics.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router: ExpressRouter = Router();

const organizerMiddleware = [
  authenticate,
  requireRole('organizer', 'admin'),
  requireOrganizerApproved,
];

// GET /analytics/dashboard
// Organizer dashboard overview stats.
router.get(
  '/dashboard',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const stats = await getOrganizerDashboardStats(authReq.user.userId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/revenue?months=12
// Monthly revenue breakdown for organizer.
router.get(
  '/revenue',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const months = Math.min(parseInt(String(req.query['months'] ?? '12'), 10), 24);
      const data = await getOrganizerMonthlyRevenue(authReq.user.userId, months);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/events/:eventId
// Per-event ticket type stats.
router.get(
  '/events/:eventId',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { eventId } = req.params as { eventId: string };
      const data = await getEventAnalytics(eventId, authReq.user.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/events/:eventId/orders?page=1&limit=20
// Paginated paid orders for a specific event.
router.get(
  '/events/:eventId/orders',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { eventId } = req.params as { eventId: string };
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
      const { rows, total } = await getEventOrdersForOrganizer(
        eventId,
        authReq.user.userId,
        page,
        limit
      );
      res.json({
        success: true,
        data: { items: rows, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/events/:eventId/attendees?page=1&limit=20&search=
// Paginated attendees for a specific event.
router.get(
  '/events/:eventId/attendees',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { eventId } = req.params as { eventId: string };
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
      const search = req.query['search'] as string | undefined;
      const { rows, total } = await getEventAttendeesForOrganizer(
        eventId,
        authReq.user.userId,
        page,
        limit,
        search
      );
      res.json({
        success: true,
        data: { items: rows, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /analytics/orders?page=1&limit=20&status=paid
// All orders across all organizer's events.
router.get(
  '/orders',
  ...organizerMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
      const status = req.query['status'] as string | undefined;
      const { rows, total } = await getOrganizerOrderList(
        authReq.user.userId,
        page,
        limit,
        status
      );
      res.json({
        success: true,
        data: { items: rows, total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as analyticsRouter };
import { Router } from 'express';
import type {
  Router as ExpressRouter,
  Request,
  Response,
  NextFunction,
} from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createOrderSchema,
  initializePaymentSchema,
  checkInSchema,
  refundOrderSchema,
} from '@eventhub/validators';
import {
  createOrder,
  getOrderByNumber,
  getUserOrders,
} from '../services/order.service.js';
import {
  initializePayment,
  manualVerifyPayment,
  processRefund,
} from '../services/payment.service.js';
import { checkInAttendee } from '../services/attendee.service.js';
import { enqueueOrderExpiry } from '../jobs/producers/cleanup.producer.js';
import { enqueueQrCodeGeneration } from '../jobs/producers/qrcode.producer.js';
import { createFreeOrderAttendees } from '../services/attendee.service.js';
import { db } from '../db/index.js';
import { orders, ticketTypes } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';
import { logger } from '../lib/logger.js';

const router: ExpressRouter = Router();

// All order routes require authentication
router.use(authenticate);

// ─── Create order ─────────────────────────────────────────────────────────────

/**
 * POST /orders
 * Create a new order (paid or free).
 * For free orders: attendees are created immediately and order is marked paid.
 * For paid orders: order is pending, client redirects to Paystack.
 */
router.post(
  '/',
  validate(createOrderSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId, email } = authReq.user;

      // Load user's full name and phone for the order
      const { users } = await import('../db/schema/index.js');
      const [user] = await db
        .select({
          fullName: users.fullName,
          phoneNumber: users.phoneNumber,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not found.' },
        });
        return;
      }

      const result = await createOrder(
        userId,
        user.fullName,
        email,
        user.phoneNumber,
        req.body as Parameters<typeof createOrder>[4]
      );

      // For free orders: complete immediately
      if (result.isFreeOrder) {
        // Create attendees using purchaser's info
        await createFreeOrderAttendees(
          result.orderId,
          user.fullName,
          email,
          user.phoneNumber
        );

        // Mark order paid
        await db
          .update(orders)
          .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
          .where(eq(orders.id, result.orderId));

        // Update quantitySold for each ticket type
        const { orderItems } = await import('../db/schema/index.js');
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, result.orderId));

        for (const item of items) {
          await db
            .update(ticketTypes)
            .set({
              quantitySold: sql`${ticketTypes.quantitySold} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(ticketTypes.id, item.ticketTypeId));
        }

        // Enqueue QR code generation
        await enqueueQrCodeGeneration({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
        });

        logger.info('Free order completed immediately', {
          orderId: result.orderId,
          orderNumber: result.orderNumber,
        });
      } else {
        // Paid order: schedule expiry
        await enqueueOrderExpiry({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
        });
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Initialize payment ───────────────────────────────────────────────────────

/**
 * POST /orders/:orderId/pay
 * Initialize Paystack payment for a pending paid order.
 * Returns { authorizationUrl, reference, accessCode }.
 */
router.post(
  '/:orderId/pay',
  validate(initializePaymentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.params as { orderId: string };
      const body = req.body as Parameters<typeof initializePayment>[2] extends never
        ? never
        : { orderId: string; attendees: Parameters<typeof initializePayment>[2]; callbackUrl?: string };

      const { attendees: attendeeDetails, callbackUrl } = req.body as {
        attendees: Parameters<typeof initializePayment>[2];
        callbackUrl?: string;
      };

      const result = await initializePayment(
        orderId,
        authReq.user.userId,
        attendeeDetails,
        callbackUrl
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Manual verify ────────────────────────────────────────────────────────────

/**
 * POST /orders/:orderNumber/verify
 * Manual payment verification fallback.
 * Called when webhook was not received.
 */
router.post(
  '/:orderNumber/verify',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderNumber } = req.params as { orderNumber: string };

      const result = await manualVerifyPayment(orderNumber, authReq.user.userId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get order by order number ─────────────────────────────────────────────────

/**
 * GET /orders/:orderNumber
 * Get full order detail. Only the order owner can access.
 */
router.get(
  '/:orderNumber',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderNumber } = req.params as { orderNumber: string };

      const order = await getOrderByNumber(orderNumber, authReq.user.userId);

      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get user's orders ────────────────────────────────────────────────────────

/**
 * GET /orders
 * List the authenticated user's orders.
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const page = parseInt(String(req.query['page'] ?? '1'), 10);
      const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);

      const result = await getUserOrders(authReq.user.userId, page, limit);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Check in (organizer/admin) ───────────────────────────────────────────────

/**
 * POST /orders/check-in
 * Check in an attendee by ticket code.
 * Restricted to organizers and admins.
 */
router.post(
  '/check-in',
  requireRole('organizer', 'admin'),
  validate(checkInSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { ticketCode } = req.body as { ticketCode: string };
      const eventId = req.query['eventId'] as string;

      if (!eventId) {
        res.status(422).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'eventId query param is required.' },
        });
        return;
      }

      const result = await checkInAttendee(
        ticketCode,
        authReq.user.userId,
        eventId
      );

      res.json({ success: result.success, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Refund (admin only) ──────────────────────────────────────────────────────

/**
 * POST /orders/:orderId/refund
 * Issue a full refund for a paid order. Admin only.
 */
router.post(
  '/:orderId/refund',
  requireRole('admin'),
  validate(refundOrderSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.params as { orderId: string };
      const { reason } = req.body as { reason: string };

      await processRefund(orderId, authReq.user.userId, reason);

      res.json({
        success: true,
        data: null,
        message: 'Refund initiated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as orderRouter };
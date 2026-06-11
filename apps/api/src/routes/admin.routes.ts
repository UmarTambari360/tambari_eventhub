import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
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
import { rejectApplicationSchema, suspendUserSchema } from '@eventhub/validators';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router: ExpressRouter = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ─── Organizer Applications ──────────────────────────────────────────────────

/**
 * GET /admin/applications
 * List all organizer applications, filterable by status.
 */
router.get('/applications', async (req: Request, res: Response) => {
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
});

/**
 * GET /admin/applications/:id
 * Get a single application by ID.
 */
router.get('/applications/:id', async (req: Request, res: Response) => {
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
});

/**
 * POST /admin/applications/:id/approve
 * Approve an organizer application.
 */
router.post('/applications/:id/approve', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params as { id: string };

  await approveApplication(id, authReq.user.userId);

  res.json({
    success: true,
    data: null,
    message: 'Application approved. Organizer has been notified.',
  });
});

/**
 * POST /admin/applications/:id/reject
 * Reject an organizer application with a reason.
 */
router.post(
  '/applications/:id/reject',
  validate(rejectApplicationSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { rejectionReason } = req.body as { rejectionReason: string };

    await rejectApplication(id, authReq.user.userId, rejectionReason);

    res.json({
      success: true,
      data: null,
      message: 'Application rejected. Applicant has been notified.',
    });
  }
);

// ─── User Management ─────────────────────────────────────────────────────────

/**
 * POST /admin/users/:id/suspend
 * Suspend a user account.
 */
router.post(
  '/users/:id/suspend',
  validate(suspendUserSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };

    // Prevent admin from suspending themselves
    if (id === authReq.user.userId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'You cannot suspend your own account',
        },
      });
      return;
    }

    await suspendUser(id, reason, authReq.user.userId);

    res.json({
      success: true,
      data: null,
      message: 'User suspended successfully.',
    });
  }
);

/**
 * POST /admin/users/:id/unsuspend
 * Unsuspend a user account.
 */
router.post('/users/:id/unsuspend', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params as { id: string };

  await unsuspendUser(id, authReq.user.userId);

  res.json({
    success: true,
    data: null,
    message: 'User unsuspended successfully.',
  });
});

export { router as adminRouter };
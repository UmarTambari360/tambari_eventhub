import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response } from 'express';
import {
  authenticate,
  requireNotSuspended,
} from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  submitApplication,
  getApplicationStatus,
  getOrganizerProfile,
  listApplicationsForAdmin,
  getApplicationByIdForAdmin,
} from '../services/organizer.service.js';
import { getPaystackBanks, verifyBankAccount } from '../services/paystack.service.js';
import { submitApplicationSchema, verifyBankAccountSchema } from '@eventhub/validators';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router: ExpressRouter = Router();

/**
 * GET /organizer/banks
 * Public — returns the list of Nigerian banks from Paystack.
 * Used during the organizer application form.
 */
router.get('/banks', async (_req: Request, res: Response) => {
  const banks = await getPaystackBanks();
  res.json({
    success: true,
    data: banks.map((b) => ({ id: b.id, name: b.name, code: b.code })),
  });
});

/**
 * POST /organizer/verify-bank
 * Authenticated — verify a bank account number before application submission.
 */
router.post(
  '/verify-bank',
  authenticate,
  validate(verifyBankAccountSchema),
  async (req: Request, res: Response) => {
    const { accountNumber, bankCode } = req.body as {
      accountNumber: string;
      bankCode: string;
    };

    const result = await verifyBankAccount(accountNumber, bankCode);

    res.json({
      success: true,
      data: {
        accountNumber: result.account_number,
        accountName: result.account_name,
      },
    });
  }
);

/**
 * POST /organizer/apply
 * Authenticated, not suspended — submit an organizer application.
 */
router.post(
  '/apply',
  authenticate,
  requireNotSuspended,
  validate(submitApplicationSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;

    const application = await submitApplication({
      userId,
      ...req.body as {
        businessName: string;
        businessDescription: string;
        websiteUrl?: string;
        instagramHandle?: string;
        bankName: string;
        bankCode: string;
        bankAccountNumber: string;
        bankAccountName: string;
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        businessName: application.businessName,
      },
      message:
        'Application submitted successfully. We will review it within 2-3 business days.',
    });
  }
);

/**
 * GET /organizer/application-status
 * Authenticated — get the current user's application status.
 */
router.get(
  '/application-status',
  authenticate,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const status = await getApplicationStatus(authReq.user.userId);

    res.json({
      success: true,
      data: status,
    });
  }
);

/**
 * GET /organizer/profile
 * Authenticated organizer — get their organizer profile.
 */
router.get(
  '/profile',
  authenticate,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const profile = await getOrganizerProfile(authReq.user.userId);

    res.json({
      success: true,
      data: profile,
    });
  }
);

export { router as organizerRouter };
import { Router } from 'express';
import type { 
    Router as ExpressRouter, 
    Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  uploadBuffer,
  deleteAsset,
} from '../services/cloudinary.service.js';
import { logger } from '../lib/logger.js';

const router: ExpressRouter = Router();

// ─── Multer config ─────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function handleMulterError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(422).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
        },
      });
      return;
    }
    res.status(422).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: err.message },
    });
    return;
  }
  if (err instanceof Error && err.message.includes('Only JPEG')) {
    res.status(422).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: err.message },
    });
    return;
  }
  next(err);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /upload/event-banner
 * Upload an event banner image. Returns { url, publicId }.
 */
router.post(
  '/event-banner',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(422).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided.' },
        });
        return;
      }

      const result = await uploadBuffer(req.file.buffer, 'eventhub/events/banners');

      logger.info('Event banner uploaded', {
        userId: req.user.userId,
        publicId: result.publicId,
        bytes: result.bytes,
      });

      res.status(201).json({
        success: true,
        data: { url: result.url, publicId: result.publicId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /upload/event-thumbnail
 * Upload an event thumbnail. Returns { url, publicId }.
 */
router.post(
  '/event-thumbnail',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(422).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided.' },
        });
        return;
      }

      const result = await uploadBuffer(req.file.buffer, 'eventhub/events/thumbnails');

      logger.info('Event thumbnail uploaded', {
        userId: req.user.userId,
        publicId: result.publicId,
        bytes: result.bytes,
      });

      res.status(201).json({
        success: true,
        data: { url: result.url, publicId: result.publicId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /upload/avatar
 * Upload a user avatar. Returns { url, publicId }.
 */
router.post(
  '/avatar',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(422).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file provided.' },
        });
        return;
      }

      const result = await uploadBuffer(req.file.buffer, 'eventhub/users/avatars');

      logger.info('Avatar uploaded', {
        userId: req.user.userId,
        publicId: result.publicId,
      });

      res.status(201).json({
        success: true,
        data: { url: result.url, publicId: result.publicId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /upload/:publicId
 * Delete a Cloudinary asset by its public ID.
 * The publicId is base64-encoded in the URL to handle slashes safely.
 */
router.delete(
  '/:encodedPublicId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { encodedPublicId } = req.params as { encodedPublicId: string };

      let publicId: string;
      try {
        publicId = Buffer.from(encodedPublicId, 'base64url').toString('utf8');
      } catch {
        res.status(422).json({
          success: false,
          error: { code: 'INVALID_PUBLIC_ID', message: 'Invalid public ID encoding.' },
        });
        return;
      }

      // Security: ensure the publicId belongs to the eventhub/ namespace
      if (!publicId.startsWith('eventhub/')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot delete assets outside the eventhub namespace.' },
        });
        return;
      }

      await deleteAsset(publicId);

      logger.info('Asset deletion requested', {
        userId: req.user.userId,
        publicId,
      });

      res.status(200).json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  }
);

export { router as uploadRouter };
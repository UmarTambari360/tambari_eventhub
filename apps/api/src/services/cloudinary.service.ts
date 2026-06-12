import { type UploadApiOptions, v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

// Configure Cloudinary once on module load
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadFolder =
  | 'eventhub/events/banners'
  | 'eventhub/events/thumbnails'
  | 'eventhub/users/avatars'
  | 'eventhub/tickets/qrcodes';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// ─── Transform presets ────────────────────────────────────────────────────────

const TRANSFORMS: Record<
  UploadFolder,
  { transformation: object[]; eager?: object[] }
> = {
  'eventhub/events/banners': {
    transformation: [
      { 
        width: 1920, height: 1080, crop: 'limit', 
        fetch_format: 'auto', quality: 'auto:good' },
    ],
    eager: [
      { 
        width: 1200, height: 630, crop: 'fill', 
        fetch_format: 'auto', quality: 'auto:good' },
    ],
  },
  'eventhub/events/thumbnails': {
    transformation: [
      { 
        width: 800, height: 600, crop: 'limit', 
        fetch_format: 'auto', quality: 'auto' },
    ],
    eager: [
      { 
        width: 400, height: 300, crop: 'fill', 
        fetch_format: 'auto', quality: 'auto' },
    ],
  },
  'eventhub/users/avatars': {
    transformation: [
      { 
        width: 400, height: 400, crop: 'fill', 
        gravity: 'face', fetch_format: 'auto', quality: 'auto' },
    ],
  },
  'eventhub/tickets/qrcodes': {
    transformation: [],
  },
};

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL, public_id, and file metadata.
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: UploadFolder,
  options: { filename?: string } = {}
): Promise<UploadResult> {
  const { transformation, eager } = TRANSFORMS[folder];

  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: 'image',
      use_filename: !!options.filename,
      unique_filename: true,
      overwrite: false,
      transformation,
      ...(eager ? { eager, eager_async: true } : {}),
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        logger.error('Cloudinary upload failed', { error: error?.message, folder });
        reject(new Error(error?.message ?? 'Cloudinary upload failed'));
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    });

    stream.end(buffer);
  });
}

/**
 * Upload a raw QR code PNG buffer.
 * Used by the qrcode worker — no transformation applied.
 */
export async function uploadQrCode(
  buffer: Buffer,
  ticketCode: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'eventhub/tickets/qrcodes',
        public_id: ticketCode,
        resource_type: 'image',
        overwrite: true,
        format: 'png',
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary QR upload failed', { error: error?.message, ticketCode });
          reject(new Error(error?.message ?? 'Cloudinary QR upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete an asset from Cloudinary by its public_id.
 * Non-fatal — logs warning on failure but does not throw.
 */
export async function deleteAsset(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result !== 'ok' && result.result !== 'not found') {
      logger.warn('Cloudinary delete returned unexpected result', {
        publicId,
        result: result.result,
      });
    } else {
      logger.info('Cloudinary asset deleted', { publicId });
    }
  } catch (err) {
    logger.warn('Cloudinary delete failed (non-fatal)', {
      publicId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Delete multiple assets in a batch.
 */
export async function deleteAssets(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;
  await Promise.allSettled(publicIds.map((id) => deleteAsset(id)));
}
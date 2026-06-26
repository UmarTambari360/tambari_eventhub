// components/shared/image-upload.tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export type UploadType = 'event-banner' | 'event-thumbnail' | 'avatar';

interface ImageUploadProps {
  type: UploadType;
  value?: string; // Current image URL (for preview)
  publicId?: string; // Current public_id (for deletion)
  accessToken: string;
  onChange: (result: { url: string; publicId: string } | null) => void;
  label?: string;
  hint?: string;
  aspectRatio?: string; // e.g. "16/9", "4/3", "1/1"
  className?: string;
  disabled?: boolean;
}

const ENDPOINT_MAP: Record<UploadType, string> = {
  'event-banner': '/upload/event-banner',
  'event-thumbnail': '/upload/event-thumbnail',
  avatar: '/upload/avatar',
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export function ImageUpload({
  type,
  value,
  publicId,
  accessToken,
  onChange,
  label,
  hint,
  aspectRatio = '16/9',
  className,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Client-side validation
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed.');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File size must not exceed ${MAX_SIZE_MB} MB.`);
        return;
      }

      setUploading(true);

      try {
        // Delete existing asset first if replacing
        if (publicId) {
          const encodedPublicId = btoa(publicId)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          await fetch(`${API_URL}/upload/${encodedPublicId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}${ENDPOINT_MAP[type]}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });

        const data = (await response.json()) as {
          success: boolean;
          data?: { url: string; publicId: string };
          error?: { message: string };
        };

        if (!response.ok || !data.success || !data.data) {
          setError(data.error?.message ?? 'Upload failed. Please try again.');
          return;
        }

        onChange(data.data);
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setUploading(false);
        // Reset file input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [type, publicId, accessToken, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleRemove = async () => {
    if (!publicId || deleting) return;
    setDeleting(true);
    setError(null);

    try {
      const encodedPublicId = btoa(publicId)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await fetch(`${API_URL}/upload/${encodedPublicId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      onChange(null);
    } catch {
      setError('Failed to remove image. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const isLoading = uploading || deleting;

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="text-text-primary">{label}</Label>}

      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-colors overflow-hidden',
          dragActive ? 'border-primary-400 bg-primary-50' : 'border-border',
          !disabled &&
            !isLoading &&
            'cursor-pointer hover:border-primary-300 hover:bg-surface-raised',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
        style={{ aspectRatio }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled && !isLoading) fileInputRef.current?.click();
        }}
      >
        {/* Preview */}
        {value && !uploading ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Uploaded image" className="w-full h-full object-cover" />
            {/* Remove button */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleRemove();
                }}
                disabled={isLoading}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                aria-label="Remove image"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            )}
            {/* Replace overlay on hover */}
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 text-white">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs font-medium">Replace image</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Upload prompt */
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="text-sm text-text-secondary">Uploading...</p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
                  <ImageIcon className="h-6 w-6 text-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    <span className="text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    JPEG, PNG, WebP — max {MAX_SIZE_MB} MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || isLoading}
        aria-label={label ?? 'Upload image'}
      />
    </div>
  );
}

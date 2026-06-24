import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { SubmitApplicationInput } from '@eventhub/validators';
import { cn } from '@/lib/utils';

interface BusinessInfoStepProps {
  register: UseFormRegister<SubmitApplicationInput>;
  errors: FieldErrors<SubmitApplicationInput>;
}

export function BusinessInfoStep({ register, errors }: BusinessInfoStepProps) {
  return (
    <motion.div
      key="business"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-text-primary">Business Information</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="label-text">
            Business Name <span className="text-danger">*</span>
          </label>
          <input
            {...register('businessName')}
            className={cn('input-base', errors.businessName && 'input-error')}
            placeholder="Lagos Live Events"
          />
          {errors.businessName && <p className="field-error">{errors.businessName.message}</p>}
        </div>

        <div>
          <label className="label-text">
            Business Description <span className="text-danger">*</span>
          </label>
          <textarea
            {...register('businessDescription')}
            rows={4}
            className={cn('input-base resize-none', errors.businessDescription && 'input-error')}
            placeholder="Tell us about your business, the types of events you host, and your experience..."
          />
          {errors.businessDescription && (
            <p className="field-error">{errors.businessDescription.message}</p>
          )}
        </div>

        <div>
          <label className="label-text">
            Website URL <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            {...register('websiteUrl')}
            type="url"
            className={cn('input-base', errors.websiteUrl && 'input-error')}
            placeholder="https://yourwebsite.com"
          />
          {errors.websiteUrl && <p className="field-error">{errors.websiteUrl.message}</p>}
        </div>

        <div>
          <label className="label-text">
            Instagram Handle <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            {...register('instagramHandle')}
            className="input-base"
            placeholder="@yourbusiness"
          />
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { UseFormGetValues } from 'react-hook-form';
import { SubmitApplicationInput } from '@eventhub/validators';

interface ReviewStepProps {
  getValues: UseFormGetValues<SubmitApplicationInput>;
}

export function ReviewStep({ getValues }: ReviewStepProps) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <h2 className="text-lg font-semibold text-text-primary mb-6">Review Your Application</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            Business Information
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-text-muted">Business Name</dt>
              <dd className="font-medium text-text-primary text-right max-w-[60%]">
                {getValues('businessName')}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-text-muted">Description</dt>
              <dd className="font-medium text-text-primary text-right max-w-[60%] truncate">
                {getValues('businessDescription')?.slice(0, 60)}...
              </dd>
            </div>
            {getValues('websiteUrl') && (
              <div className="flex justify-between text-sm">
                <dt className="text-text-muted">Website</dt>
                <dd className="font-medium text-text-primary">{getValues('websiteUrl')}</dd>
              </div>
            )}
            {getValues('instagramHandle') && (
              <div className="flex justify-between text-sm">
                <dt className="text-text-muted">Instagram</dt>
                <dd className="font-medium text-text-primary">{getValues('instagramHandle')}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            Bank Account
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-text-muted">Bank</dt>
              <dd className="font-medium text-text-primary">{getValues('bankName')}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-text-muted">Account Number</dt>
              <dd className="font-medium text-text-primary">
                ****{getValues('bankAccountNumber')?.slice(-4)}
              </dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-text-muted">Account Name</dt>
              <dd className="font-medium text-success">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {getValues('bankAccountName')}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg bg-surface-raised border border-border p-4 text-sm text-text-secondary">
          By submitting, you confirm that the information above is accurate and you agree to
          EventHub's organizer terms of service.
        </div>
      </div>
    </motion.div>
  );
}

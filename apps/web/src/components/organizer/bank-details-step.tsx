import { motion } from 'framer-motion';
import { CreditCard, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { SubmitApplicationInput } from '@eventhub/validators';
import { cn } from '@/lib/utils';

interface Bank {
  id: number;
  name: string;
  code: string;
}

interface BankDetailsStepProps {
  register: UseFormRegister<SubmitApplicationInput>;
  errors: FieldErrors<SubmitApplicationInput>;
  setValue: UseFormSetValue<SubmitApplicationInput>;
  banks: Bank[];
  banksLoading: boolean;
  verifying: boolean;
  verifiedAccountName: string | null;
  verifyError: string | null;
}

export function BankDetailsStep({
  register,
  errors,
  setValue,
  banks,
  banksLoading,
  verifying,
  verifiedAccountName,
  verifyError,
}: BankDetailsStepProps) {
  return (
    <motion.div
      key="bank"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-text-primary">Bank Account Details</h2>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-lg bg-info-light border border-info/20 p-3">
        <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
        <p className="text-xs text-text-secondary">
          Your ticket revenue will be paid directly to this account via Paystack. We verify account
          details with your bank in real time.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="label-text">
            Bank <span className="text-danger">*</span>
          </label>
          <select
            {...register('bankCode')}
            onChange={(e) => {
              const bank = banks.find((b) => b.code === e.target.value);
              setValue('bankCode', e.target.value);
              setValue('bankName', bank?.name ?? '');
            }}
            className={cn('input-base appearance-none', errors.bankCode && 'input-error')}
          >
            <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          {errors.bankCode && <p className="field-error">{errors.bankCode.message}</p>}
        </div>

        <div>
          <label className="label-text">
            Account Number <span className="text-danger">*</span>
          </label>
          <input
            {...register('bankAccountNumber')}
            className={cn('input-base', errors.bankAccountNumber && 'input-error')}
            placeholder="0123456789"
            maxLength={10}
            inputMode="numeric"
          />
          {errors.bankAccountNumber && (
            <p className="field-error">{errors.bankAccountNumber.message}</p>
          )}
        </div>

        {/* Account verification status */}
        <div>
          <label className="label-text">Account Name</label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm min-h-[42px] transition-colors',
              verifiedAccountName
                ? 'border-success/50 bg-success-light'
                : verifyError
                  ? 'border-danger/50 bg-danger-light'
                  : 'border-border bg-surface-sunken'
            )}
          >
            {verifying && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                <span className="text-text-secondary">Verifying account...</span>
              </>
            )}
            {!verifying && verifiedAccountName && (
              <>
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                <span className="font-medium text-success">{verifiedAccountName}</span>
              </>
            )}
            {!verifying && verifyError && (
              <>
                <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                <span className="text-danger">{verifyError}</span>
              </>
            )}
            {!verifying && !verifiedAccountName && !verifyError && (
              <span className="text-text-muted">
                Enter account number and select bank to verify
              </span>
            )}
          </div>
          {/* Hidden fields for form validation */}
          <input type="hidden" {...register('bankAccountName')} />
          <input type="hidden" {...register('bankName')} />
        </div>
      </div>
    </motion.div>
  );
}

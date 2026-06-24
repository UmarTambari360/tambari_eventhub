'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { submitApplicationSchema, type SubmitApplicationInput } from '@eventhub/validators';
import {
  submitOrganizerApplicationAction,
  getPaystackBanksAction,
  verifyBankAccountAction,
  getApplicationStatusAction,
} from '@/actions/organizer.actions';
import { ReviewStep } from '@/components/organizer/review-step';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StepIndicator } from '@/components/organizer/step-indicator';
import { SubmittedState } from '@/components/organizer/submitted-state';
import { BankDetailsStep } from '@/components/organizer/bank-details-step';
import { BusinessInfoStep } from '@/components/organizer/business-info-step';
import { ExistingApplicationState } from '@/components/organizer/existing-application-state';
import { cn } from '@/lib/utils';

interface Bank {
  id: number;
  name: string;
  code: string;
}

type Step = 'business' | 'bank' | 'review' | 'submitted';

const STEP_ORDER: Exclude<Step, 'submitted'>[] = ['business', 'bank', 'review'];
const STEP_LABELS: Record<Exclude<Step, 'submitted'>, string> = {
  business: 'Business Info',
  bank: 'Bank Details',
  review: 'Review & Submit',
};

export default function BecomeAnOrganizerPage() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const accessToken = auth?.accessToken ?? null;
  const authLoading = auth?.isLoading ?? false;
  const router = useRouter();

  const [step, setStep] = useState<Step>('business');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<SubmitApplicationInput>({
    resolver: zodResolver(submitApplicationSchema),
    mode: 'onTouched',
  });

  const watchedAccountNumber = watch('bankAccountNumber');
  const watchedBankCode = watch('bankCode');

  // Load existing application status and banks on mount
  useEffect(() => {
    if (authLoading) return;

    if (!user || !accessToken) {
      router.push('/sign-in?next=/become-an-organizer');
      return;
    }

    void (async () => {
      const [statusResult, banksResult] = await Promise.all([
        getApplicationStatusAction(accessToken),
        getPaystackBanksAction(),
      ]);

      if (statusResult.success && statusResult.data) {
        setExistingStatus(statusResult.data.status);
      }

      if (banksResult.success && banksResult.data) {
        setBanks(banksResult.data);
      }

      setBanksLoading(false);
      setPageLoading(false);
    })();
  }, [user, accessToken, authLoading, router]);

  // Auto-verify bank account when both account number and bank are filled
  const verifyAccount = useCallback(async () => {
    if (!accessToken) return;
    const accountNum = getValues('bankAccountNumber');
    const bankCode = getValues('bankCode');

    if (!/^\d{10}$/.test(accountNum) || !bankCode) return;

    setVerifying(true);
    setVerifyError(null);
    setVerifiedAccountName(null);

    const result = await verifyBankAccountAction(accountNum, bankCode, accessToken);

    if (result.success && result.data) {
      setVerifiedAccountName(result.data.accountName);
      setValue('bankAccountName', result.data.accountName);
    } else {
      setVerifyError(result.error ?? 'Could not verify account. Please check the details.');
    }

    setVerifying(false);
  }, [accessToken, getValues, setValue]);

  useEffect(() => {
    if (/^\d{10}$/.test(watchedAccountNumber ?? '') && watchedBankCode) {
      void verifyAccount();
    } else {
      setVerifiedAccountName(null);
      setVerifyError(null);
    }
  }, [watchedAccountNumber, watchedBankCode, verifyAccount]);

  const handleNextStep = async () => {
    if (step === 'business') {
      const valid = await trigger([
        'businessName',
        'businessDescription',
        'websiteUrl',
        'instagramHandle',
      ]);
      if (valid) setStep('bank');
    } else if (step === 'bank') {
      const valid = await trigger(['bankName', 'bankCode', 'bankAccountNumber', 'bankAccountName']);
      if (valid && verifiedAccountName) setStep('review');
    }
  };

  const onSubmit = async (data: SubmitApplicationInput) => {
    if (!accessToken) return;
    setSubmitting(true);

    const result = await submitOrganizerApplicationAction(data, accessToken);

    if (result.success) {
      setStep('submitted');
    } else {
      alert(result.error ?? 'Something went wrong');
    }

    setSubmitting(false);
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Already applied
  if (existingStatus) {
    return <ExistingApplicationState status={existingStatus} />;
  }

  // Submitted
  if (step === 'submitted') {
    return <SubmittedState />;
  }

  const currentStepIndex = STEP_ORDER.indexOf(step as Exclude<Step, 'submitted'>);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="display-md text-text-primary mb-2">Become an Organizer</h1>
        <p className="body-md text-text-muted">
          Apply to list events on EventHub and receive ticket revenue directly to your bank account
          via Paystack.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator
        steps={STEP_ORDER.map((key) => STEP_LABELS[key])}
        currentStep={currentStepIndex}
      />

      {/* Form card */}
      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Business Info */}
            {step === 'business' && <BusinessInfoStep register={register} errors={errors} />}

            {/* Step 2: Bank Details */}
            {step === 'bank' && (
              <BankDetailsStep
                register={register}
                errors={errors}
                setValue={setValue}
                banks={banks}
                banksLoading={banksLoading}
                verifying={verifying}
                verifiedAccountName={verifiedAccountName}
                verifyError={verifyError}
              />
            )}

            {/* Step 3: Review */}
            {step === 'review' && <ReviewStep getValues={getValues} />}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (step === 'bank') setStep('business');
                if (step === 'review') setStep('bank');
              }}
              className={cn('btn btn-ghost btn-md', step === 'business' && 'invisible')}
            >
              Back
            </button>

            {step !== 'review' ? (
              <button
                type="button"
                onClick={() => void handleNextStep()}
                disabled={step === 'bank' && !verifiedAccountName}
                className="btn btn-primary btn-md"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-md flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Application
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

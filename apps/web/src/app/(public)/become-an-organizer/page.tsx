'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Building2, CreditCard, Info } from 'lucide-react';
import { submitApplicationSchema, type SubmitApplicationInput } from '@eventhub/validators';
import { useAuth } from '@/hooks/use-auth';
import {
  submitOrganizerApplicationAction,
  getPaystackBanksAction,
  verifyBankAccountAction,
  getApplicationStatusAction,
} from '@/actions/organizer.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';

interface Bank {
  id: number;
  name: string;
  code: string;
}

type Step = 'business' | 'bank' | 'review' | 'submitted';

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
      // Error handling — show inline error
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
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Application</h1>
          <div className="mb-6">
            <StatusBadge status={existingStatus as 'pending' | 'approved' | 'rejected'} />
          </div>
          {existingStatus === 'pending' && (
            <p className="text-gray-600">
              Your application is currently under review. We'll notify you by email within 2–3
              business days.
            </p>
          )}
          {existingStatus === 'approved' && (
            <>
              <p className="text-gray-600 mb-6">
                Your application has been approved. Visit your organizer dashboard to start creating
                events.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg bg-violet-600 px-6 py-3 text-white font-medium hover:bg-violet-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          )}
          {existingStatus === 'rejected' && (
            <p className="text-gray-600">
              Your previous application was not approved. You may submit a new application
              addressing the feedback provided.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg px-4 py-20 text-center"
      >
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            We've received your application and will review it within 2–3 business days. Check your
            email for updates.
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-violet-600 px-6 py-3 text-white font-medium hover:bg-violet-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    );
  }

  const stepLabels: Record<Exclude<Step, 'submitted'>, string> = {
    business: 'Business Info',
    bank: 'Bank Details',
    review: 'Review & Submit',
  };

  const stepOrder: Exclude<Step, 'submitted'>[] = ['business', 'bank', 'review'];
  const currentStepIndex = stepOrder.indexOf(step as Exclude<Step, 'submitted'>);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Become an Organizer</h1>
        <p className="text-gray-600">
          Apply to list events on EventHub and receive ticket revenue directly to your bank account
          via Paystack.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {stepOrder.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                i < currentStepIndex
                  ? 'bg-violet-600 text-white'
                  : i === currentStepIndex
                    ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                    : 'bg-gray-100 text-gray-400'
              )}
            >
              {i < currentStepIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                i === currentStepIndex ? 'text-violet-700' : 'text-gray-400'
              )}
            >
              {stepLabels[s]}
            </span>
            {i < stepOrder.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-0.5 w-8',
                  i < currentStepIndex ? 'bg-violet-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Business Info */}
            {step === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('businessName')}
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500',
                        errors.businessName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      )}
                      placeholder="Lagos Live Events"
                    />
                    {errors.businessName && (
                      <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Business Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('businessDescription')}
                      rows={4}
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none',
                        errors.businessDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      )}
                      placeholder="Tell us about your business, the types of events you host, and your experience..."
                    />
                    {errors.businessDescription && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.businessDescription.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Website URL <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      {...register('websiteUrl')}
                      type="url"
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500',
                        errors.websiteUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      )}
                      placeholder="https://yourwebsite.com"
                    />
                    {errors.websiteUrl && (
                      <p className="mt-1 text-xs text-red-600">{errors.websiteUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Instagram Handle <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      {...register('instagramHandle')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="@yourbusiness"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Bank Details */}
            {step === 'bank' && (
              <motion.div
                key="bank"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-violet-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Bank Account Details</h2>
                </div>
                <div className="mb-6 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Your ticket revenue will be paid directly to this account via Paystack. We
                    verify account details with your bank in real time.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bank <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('bankCode')}
                      onChange={(e) => {
                        const bank = banks.find((b) => b.code === e.target.value);
                        setValue('bankCode', e.target.value);
                        setValue('bankName', bank?.name ?? '');
                      }}
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white',
                        errors.bankCode ? 'border-red-300' : 'border-gray-300'
                      )}
                    >
                      <option value="">
                        {banksLoading ? 'Loading banks...' : 'Select your bank'}
                      </option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {errors.bankCode && (
                      <p className="mt-1 text-xs text-red-600">{errors.bankCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('bankAccountNumber')}
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500',
                        errors.bankAccountNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      )}
                      placeholder="0123456789"
                      maxLength={10}
                      inputMode="numeric"
                    />
                    {errors.bankAccountNumber && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.bankAccountNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Account verification status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Account Name
                    </label>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm min-h-[42px]',
                        verifiedAccountName
                          ? 'border-green-300 bg-green-50'
                          : verifyError
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                      )}
                    >
                      {verifying && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                          <span className="text-gray-500">Verifying account...</span>
                        </>
                      )}
                      {!verifying && verifiedAccountName && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="font-medium text-green-800">{verifiedAccountName}</span>
                        </>
                      )}
                      {!verifying && verifyError && (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-red-700">{verifyError}</span>
                        </>
                      )}
                      {!verifying && !verifiedAccountName && !verifyError && (
                        <span className="text-gray-400">
                          Enter account number and select bank to verify
                        </span>
                      )}
                    </div>
                    {/* Hidden field for form validation */}
                    <input type="hidden" {...register('bankAccountName')} />
                    <input type="hidden" {...register('bankName')} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Review Your Application
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Business Information
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Business Name</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%]">
                          {getValues('businessName')}
                        </dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Description</dt>
                        <dd className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                          {getValues('businessDescription').slice(0, 60)}...
                        </dd>
                      </div>
                      {getValues('websiteUrl') && (
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Website</dt>
                          <dd className="font-medium text-gray-900">{getValues('websiteUrl')}</dd>
                        </div>
                      )}
                      {getValues('instagramHandle') && (
                        <div className="flex justify-between text-sm">
                          <dt className="text-gray-500">Instagram</dt>
                          <dd className="font-medium text-gray-900">
                            {getValues('instagramHandle')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Bank Account
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Bank</dt>
                        <dd className="font-medium text-gray-900">{getValues('bankName')}</dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Account Number</dt>
                        <dd className="font-medium text-gray-900">
                          ****{getValues('bankAccountNumber').slice(-4)}
                        </dd>
                      </div>
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500">Account Name</dt>
                        <dd className="font-medium text-green-700">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {getValues('bankAccountName')}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                    By submitting, you confirm that the information above is accurate and you agree
                    to EventHub's organizer terms of service.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (step === 'bank') setStep('business');
                if (step === 'review') setStep('bank');
              }}
              className={cn(
                'rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors',
                step === 'business' && 'invisible'
              )}
            >
              Back
            </button>

            {step !== 'review' ? (
              <button
                type="button"
                onClick={() => void handleNextStep()}
                disabled={step === 'bank' && !verifiedAccountName}
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
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

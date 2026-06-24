import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/status-badge';

interface ExistingApplicationStateProps {
  status: string;
}

export function ExistingApplicationState({ status }: ExistingApplicationStateProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="card p-8">
        <h1 className="heading-xl text-text-primary mb-4">Your Application</h1>
        <div className="mb-6">
          <StatusBadge status={status as 'pending' | 'approved' | 'rejected'} />
        </div>
        {status === 'pending' && (
          <p className="body-sm text-text-muted">
            Your application is currently under review. We'll notify you by email within 2–3
            business days.
          </p>
        )}
        {status === 'approved' && (
          <>
            <p className="body-sm text-text-muted mb-6">
              Your application has been approved. Visit your organizer dashboard to start creating
              events.
            </p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary">
              Go to Dashboard
            </button>
          </>
        )}
        {status === 'rejected' && (
          <p className="body-sm text-text-muted">
            Your previous application was not approved. You may submit a new application addressing
            the feedback provided.
          </p>
        )}
      </div>
    </div>
  );
}

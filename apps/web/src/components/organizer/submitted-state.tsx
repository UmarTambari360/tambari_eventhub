import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SubmittedState() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg px-4 py-20 text-center"
    >
      <div className="card p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-light">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="heading-xl text-text-primary mb-3">Application Submitted!</h1>
        <p className="body-sm text-text-muted mb-6">
          We've received your application and will review it within 2–3 business days. Check your
          email for updates.
        </p>
        <button onClick={() => router.push('/')} className="btn btn-primary btn-lg">
          Back to Home
        </button>
      </div>
    </motion.div>
  );
}

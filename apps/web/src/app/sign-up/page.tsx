'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { ApiError } from '../../lib/api-client';

export default function SignUpPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        // RegisterInput expects a string for phoneNumber, so ensure we pass
        // an empty string when no phone number is provided.
        phoneNumber: formData.phoneNumber || '',
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const fields = [
    {
      id: 'fullName',
      label: 'Full name',
      type: 'text',
      autoComplete: 'name',
      placeholder: 'Emeka Okafor',
      required: true,
    },
    {
      id: 'email',
      label: 'Email address',
      type: 'email',
      autoComplete: 'email',
      placeholder: 'you@example.com',
      required: true,
    },
    {
      id: 'phoneNumber',
      label: 'Phone number',
      type: 'tel',
      autoComplete: 'tel',
      placeholder: '+2348012345678',
      required: false,
      hint: 'optional',
    },
    {
      id: 'password',
      label: 'Password',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: 'Min. 8 characters',
      required: true,
    },
    {
      id: 'confirmPassword',
      label: 'Confirm password',
      type: 'password',
      autoComplete: 'new-password',
      placeholder: 'Repeat your password',
      required: true,
    },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-(--surface-raised)">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-110"
      >
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-black">
              E
            </div>
          </div>

          <h1 className="heading-xl text-(--text-primary) text-center mb-1">
            Create your account
          </h1>
          <p className="body-sm text-(--text-muted) text-center mb-6">
            Join EventHub and discover amazing events
          </p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-(--danger-light) border border-(--danger)/20 p-3.5 mb-5">
              <AlertCircle className="h-4 w-4 text-(--danger) mt-0.5 shrink-0" />
              <p className="text-sm text-(--danger) font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="label-text">
                  {f.label}{' '}
                  {f.hint && (
                    <span className="text-(--text-muted) font-normal">({f.hint})</span>
                  )}
                </label>
                <input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  required={f.required}
                  value={formData[f.id as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="input-base"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-md w-full mt-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center mt-5 body-sm text-(--text-muted)">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-(--primary) hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

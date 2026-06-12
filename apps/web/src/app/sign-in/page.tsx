'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { ApiError } from '../../lib/api-client';

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') ?? '/';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: formData.email, password: formData.password });
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-(--surface-raised)">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-105"
      >
        {/* Card */}
        <div className="card p-8">
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-black">
              E
            </div>
          </div>

          <h1 className="heading-xl text-(--text-primary) text-center mb-1">Welcome back</h1>
          <p className="body-sm text-(--text-muted) text-center mb-6">
            Sign in to your EventHub account
          </p>

          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-(--danger-light) border border-(--danger)/20 p-3.5 mb-5">
              <AlertCircle className="h-4 w-4 text-(--danger) mt-0.5 shrink-0" />
              <p className="text-sm text-(--danger) font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label-text">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-text">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Your password"
                className="input-base"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-md w-full mt-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center mt-5 body-sm text-(--text-muted)">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="font-semibold text-(--primary) hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

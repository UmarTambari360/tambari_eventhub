'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { ApiError } from '../../lib/api-client';
import { loginSchema, type LoginInput } from '@eventhub/validators';

// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') ?? '/';

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleSubmit(data: LoginInput) {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: data.email, password: data.password });
      router.push(nextUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-raised">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-105"
      >
        <Card className="border-border shadow-card-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-black">
                TE
              </div>
            </div>
            <CardTitle className="heading-xl text-text-primary">Welcome back</CardTitle>
            <CardDescription className="body-sm text-text-muted">
              Sign in to your EventHub account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-lg bg-danger-light border border-danger/20 p-3.5 mb-5"
              >
                <AlertCircle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                <p className="text-sm text-danger font-medium">{error}</p>
              </motion.div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-text">Email address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="input-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="label-text">Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-xs font-medium text-brand hover:underline transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Your password"
                            autoComplete="current-password"
                            className="input-base pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-md w-full mt-2"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-center pt-0">
            <p className="body-sm text-text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="font-semibold text-brand hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}

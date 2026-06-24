'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { registerSchema, type RegisterInput } from '@eventhub/validators';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/lib/api-client';
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

export function SignUpForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterInput & { confirmPassword: string }>({
    resolver: zodResolver(
      registerSchema
        .extend({
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ['confirmPassword'],
        })
    ),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Password strength indicator
  type PasswordStrength = {
    score: number;
    label: string;
    color: string;
  }

  const password = form.watch('password');
  const getPasswordStrength = (pwd: string): PasswordStrength => {
    if (!pwd) return { score: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const strengths = [
      { score: 0 as number, label: 'Weak', color: 'text-danger' },
      { score: 1 as number, label: 'Weak', color: 'text-danger' },
      { score: 2 as number, label: 'Fair', color: 'text-warning' },
      { score: 3 as number, label: 'Good', color: 'text-warning' },
      { score: 4 as number, label: 'Strong', color: 'text-success' },
      { score: 5 as number, label: 'Very Strong', color: 'text-success' },
    ];
    return strengths[score] ?? strengths[0]!;
  };

  const strength = getPasswordStrength(password);

  async function handleSubmit(data: RegisterInput & { confirmPassword: string }) {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || '',
      });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border shadow-card-md">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white text-lg font-black">
            TE
          </div>
        </div>
        <CardTitle className="heading-xl text-text-primary">Create your account</CardTitle>
        <CardDescription className="body-sm text-text-muted">
          Join EventHub and discover amazing events
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-text">Full name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="input-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-text">
                    Phone number <span className="text-text-muted font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="+2348012345678"
                      autoComplete="tel"
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
                  <FormLabel className="label-text">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
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

                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-1 mr-2">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= strength.score
                                  ? strength.score <= 2
                                    ? 'bg-danger'
                                    : strength.score <= 3
                                      ? 'bg-warning'
                                      : 'bg-success'
                                  : 'bg-border'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium ${strength.color} whitespace-nowrap`}>
                          {strength.label}
                        </span>
                      </div>

                      {/* Password requirements checklist */}
                      <div className="grid grid-cols-2 gap-1 mt-1.5">
                        {[
                          { check: password.length >= 8, label: 'Min. 8 characters' },
                          { check: /[A-Z]/.test(password), label: 'Uppercase letter' },
                          { check: /[a-z]/.test(password), label: 'Lowercase letter' },
                          { check: /[0-9]/.test(password), label: 'Number' },
                        ].map((req) => (
                          <div key={req.label} className="flex items-center gap-1.5 text-xs">
                            {req.check ? (
                              <Check className="h-3 w-3 text-success" />
                            ) : (
                              <X className="h-3 w-3 text-text-muted" />
                            )}
                            <span className={req.check ? 'text-text-secondary' : 'text-text-muted'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="label-text">Confirm password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        className="input-base pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
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
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-center pt-0">
        <p className="body-sm text-text-muted">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

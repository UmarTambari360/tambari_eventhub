'use client';

import { motion } from 'framer-motion';
import { SignUpForm } from '@/components/auth/sign-up-form';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-raised">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-110"
      >
        <SignUpForm />
      </motion.div>
    </main>
  );
}

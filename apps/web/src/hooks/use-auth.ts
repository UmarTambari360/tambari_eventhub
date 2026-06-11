'use client';

import { ContextType, useContext } from 'react';
import { AuthContext } from '@/providers/auth-provider';

export function useAuth(): ContextType<typeof AuthContext> {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
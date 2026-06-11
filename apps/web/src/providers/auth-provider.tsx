'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { setAccessToken, clearAccessToken } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'attendee' | 'organizer' | 'admin';
  isSuspended?: boolean;
}

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthApiResponse {
  user: AuthUser;
  accessToken: string;
}

interface AuthContextValue {
  accessToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  /**
   * On mount, attempt a silent refresh to restore session.
   * If the httpOnly refresh cookie is still valid, this succeeds.
   */
  useEffect(() => {
    let cancelled = false;

    async function silentRefresh() {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok || cancelled) return;

        const json = (await res.json()) as {
          success: boolean;
          data: { user: AuthUser; accessToken: string };
        };

        if (json.success && !cancelled) {
          setAccessTokenState(json.data.accessToken);
          setUser(json.data.user);
        }
      } catch {
        // No session — user is logged out
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void silentRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<void> => {
    const data = await apiClient.post<AuthApiResponse>('/auth/register', input, false);
    setAccessToken(data.accessToken);
    setAccessTokenState(data.accessToken);
    setUser(data.user);
  }, []);

  const login = useCallback(async (input: LoginInput): Promise<void> => {
    const data = await apiClient.post<AuthApiResponse>('/auth/login', input, false);
    setAccessToken(data.accessToken);
    setAccessTokenState(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', undefined, true);
    } catch {
      // Best effort — clear client state regardless
    } finally {
      clearAccessToken();
      setAccessTokenState(null);
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout-all', undefined, true);
    } catch {
      // Best effort
    } finally {
      clearAccessToken();
      setAccessTokenState(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isLoading,
        isAuthenticated: user !== null,
        register,
        login,
        logout,
        logoutAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

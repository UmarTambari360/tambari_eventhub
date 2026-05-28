'use client';

/**
 * Singleton refresh lock.
 * If multiple requests fire simultaneously and all get 401,
 * only ONE /auth/refresh call is made. All others queue behind it.
 */

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

let _accessToken: string | null = null;
let _tokenExpiresAt: number | null = null; // Unix timestamp in ms
let _refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string, expiresInSeconds = 15 * 60): void {
  _accessToken = token;
  // Subtract 30s buffer to refresh slightly before expiry
  _tokenExpiresAt = Date.now() + (expiresInSeconds - 30) * 1000;
}

export function clearAccessToken(): void {
  _accessToken = null;
  _tokenExpiresAt = null;
}

export function getStoredAccessToken(): string | null {
  return _accessToken;
}

function isTokenExpired(): boolean {
  if (!_accessToken || !_tokenExpiresAt) return true;
  return Date.now() >= _tokenExpiresAt;
}

async function callRefreshEndpoint(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // sends httpOnly cookie
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const json = (await res.json()) as {
      success: boolean;
      data: { accessToken: string };
    };

    if (json.success && json.data.accessToken) {
      setAccessToken(json.data.accessToken);
      return json.data.accessToken;
    }

    clearAccessToken();
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

/**
 * Returns a valid access token, refreshing if needed.
 * Concurrent callers share the same refresh promise.
 */
export async function getValidToken(): Promise<string | null> {
  if (_accessToken && !isTokenExpired()) {
    return _accessToken;
  }

  // Already refreshing — join the existing promise
  if (_refreshPromise) {
    return _refreshPromise;
  }

  _refreshPromise = callRefreshEndpoint().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}
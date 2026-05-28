'use client';

import { getValidToken } from './auth-client.js';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getValidToken();
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Please log in to continue.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(
      res.status,
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'An unexpected error occurred.'
    );
  }

  return json.data;
}

export const apiClient = {
  get: <T>(path: string, requiresAuth = true) =>
    request<T>(path, { method: 'GET' }, requiresAuth),

  post: <T>(path: string, body?: unknown, requiresAuth = true) =>
    request<T>(
      path,
      { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined },
      requiresAuth
    ),

  put: <T>(path: string, body?: unknown, requiresAuth = true) =>
    request<T>(
      path,
      { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined },
      requiresAuth
    ),

  patch: <T>(path: string, body?: unknown, requiresAuth = true) =>
    request<T>(
      path,
      { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined },
      requiresAuth
    ),

  delete: <T>(path: string, requiresAuth = true) =>
    request<T>(path, { method: 'DELETE' }, requiresAuth),
};
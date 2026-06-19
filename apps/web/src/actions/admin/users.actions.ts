import { adminFetch } from './index';
import { revalidatePath } from 'next/cache';
import { ActionResult } from './index';

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
}

export async function getUsersAction(
  accessToken: string,
  params: { page?: number; role?: string; search?: string; suspended?: boolean }
): Promise<ActionResult<{ data: AdminUserRow[]; total: number; totalPages: number }>> {
  try {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: '20' });
    if (params.role) qs.set('role', params.role);
    if (params.search) qs.set('search', params.search);
    if (params.suspended !== undefined) qs.set('suspended', String(params.suspended));

    const res = await adminFetch(
      `/admin/users?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminUserRow[];
      meta: { total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !result.success) return { 
      success: false, 
      error: result.error?.message ?? 'Failed' };
    return { 
      success: true, 
      data: { 
        data: result.data, 
        total: result.meta.total, 
        totalPages: result.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getUserDetailAction(
  userId: string,
  accessToken: string
): Promise<ActionResult<{ 
  user: AdminUserRow; 
  profile: unknown; 
  orderCount: number; 
  eventCount: number }>> {
  try {
    const res = await adminFetch(
      `/admin/users/${userId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; 
      data: { 
        user: AdminUserRow; 
        profile: unknown; 
        orderCount: number; 
        eventCount: number }; 
        error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, 
      error: data.error?.message ?? 'Not found' };
    return { 
      success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function suspendUserAction(
  userId: string, reason: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/users/${userId}/suspend`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = (await res.json()) as { 
      success: boolean; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/users');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function unsuspendUserAction(
  userId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/users/${userId}/unsuspend`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { 
      success: boolean; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/users');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

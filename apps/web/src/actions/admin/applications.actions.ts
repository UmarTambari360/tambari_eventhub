import { adminFetch, ActionResult } from './index';
import { revalidatePath } from 'next/cache';
import type { OrganizerApplicationDTO } from '@eventhub/types';

export async function getApplicationsAction(
  accessToken: string,
  status?: 'pending' | 'approved' | 'rejected',
  page = 1
): Promise<ActionResult<{ 
  applications: OrganizerApplicationDTO[]; 
  total: number; totalPages: number }>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);

    const res = await adminFetch(
      `/admin/applications?${params.toString()}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as {
      success: boolean;
      data: OrganizerApplicationDTO[];
      meta: { total: number; totalPages: number; page: number; limit: number };
      error?: { message: string };
    };

    if (!res.ok || !data.success) return { 
      success: false, 
      error: data.error?.message ?? 'Failed' };
    return { 
      success: true, 
      data: { 
        applications: data.data, 
        total: data.meta.total, 
        totalPages: data.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getApplicationDetailAction(
  applicationId: string,
  accessToken: string
): Promise<ActionResult<OrganizerApplicationDTO>> {
  try {
    const res = await adminFetch(
      `/admin/applications/${applicationId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; 
      data: OrganizerApplicationDTO; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, 
      error: data.error?.message ?? 'Application not found' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function approveApplicationAction(
  applicationId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/applications/${applicationId}/approve`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { 
      success: boolean; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, 
      error: data.error?.message ?? 'Failed to approve' };
    revalidatePath('/admin/applications');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function rejectApplicationAction(
  applicationId: string,
  rejectionReason: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/applications/${applicationId}/reject`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
    const data = (await res.json()) as { 
      success: boolean; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, 
      error: data.error?.message ?? 'Failed to reject' };
    revalidatePath('/admin/applications');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

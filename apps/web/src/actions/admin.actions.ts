'use server';

import { revalidatePath } from 'next/cache';
import type { OrganizerApplicationDTO } from '@eventhub/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'];

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

async function adminFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

export async function getApplicationsAction(
  accessToken: string,
  status?: 'pending' | 'approved' | 'rejected',
  page = 1
): Promise<ActionResult<{
  applications: OrganizerApplicationDTO[];
  total: number;
  totalPages: number;
}>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);

    const response = await adminFetch(
      `/admin/applications?${params.toString()}`,
      accessToken,
      { cache: 'no-store' }
    );

    const data = (await response.json()) as {
      success: boolean;
      data: OrganizerApplicationDTO[];
      meta: { total: number; totalPages: number; page: number; limit: number };
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to fetch applications' };
    }

    return {
      success: true,
      data: {
        applications: data.data,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      },
    };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getApplicationDetailAction(
  applicationId: string,
  accessToken: string
): Promise<ActionResult<OrganizerApplicationDTO>> {
  try {
    const response = await adminFetch(
      `/admin/applications/${applicationId}`,
      accessToken,
      { cache: 'no-store' }
    );

    const data = (await response.json()) as {
      success: boolean;
      data: OrganizerApplicationDTO;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Application not found' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function approveApplicationAction(
  applicationId: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const response = await adminFetch(
      `/admin/applications/${applicationId}/approve`,
      accessToken,
      { method: 'POST' }
    );

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to approve application' };
    }

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
    const response = await adminFetch(
      `/admin/applications/${applicationId}/reject`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      }
    );

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to reject application' };
    }

    revalidatePath('/admin/applications');

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function suspendUserAction(
  userId: string,
  reason: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const response = await adminFetch(
      `/admin/users/${userId}/suspend`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to suspend user' };
    }

    revalidatePath('/admin/users');

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function unsuspendUserAction(
  userId: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const response = await adminFetch(
      `/admin/users/${userId}/unsuspend`,
      accessToken,
      { method: 'POST' }
    );

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!response.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to unsuspend user' };
    }

    revalidatePath('/admin/users');

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
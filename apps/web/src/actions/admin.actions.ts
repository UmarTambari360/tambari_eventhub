'use server';

import { revalidatePath } from 'next/cache';
import type { OrganizerApplicationDTO } from '@eventhub/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

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

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PlatformKPIs {
  gmv: { allTime: number; thisMonth: number; lastMonth: number; momGrowthPercent: number };
  platformEarnings: { allTime: number; thisMonth: number };
  users: { total: number; newThisMonth: number; approvedOrganizers: number; pendingApplications: number };
  events: { total: number; active: number; thisMonth: number };
  tickets: { total: number; thisMonth: number };
}

export interface MonthlyRevenuePoint {
  month: string;
  earnings: number;
  gmv: number;
  transactions: number;
}

export interface TopOrganizer {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  status: string;
  eventsCount: number;
  totalGmv: number;
  organizerNet: number;
  platformFee: number;
}

export interface RevenueByOrganizer {
  organizerId: string;
  fullName: string;
  businessName: string | null;
  transactionCount: number;
  grossAmount: number;
  platformFee: number;
  organizerNet: number;
}

export interface RevenueByEvent {
  eventId: string;
  title: string;
  slug: string;
  eventDate: string;
  transactionCount: number;
  grossAmount: number;
  platformFee: number;
}

export async function getPlatformKPIsAction(accessToken: string): Promise<ActionResult<PlatformKPIs>> {
  try {
    const res = await adminFetch('/admin/analytics/kpis', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: PlatformKPIs; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getRevenueChartAction(
  accessToken: string,
  months = 12
): Promise<ActionResult<MonthlyRevenuePoint[]>> {
  try {
    const res = await adminFetch(`/admin/analytics/revenue-chart?months=${months}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: MonthlyRevenuePoint[]; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getTopOrganizersAction(accessToken: string): Promise<ActionResult<TopOrganizer[]>> {
  try {
    const res = await adminFetch('/admin/analytics/top-organizers', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: TopOrganizer[]; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getRevenueBreakdownAction(accessToken: string): Promise<ActionResult<{
  byOrganizer: RevenueByOrganizer[];
  byEvent: RevenueByEvent[];
}>> {
  try {
    const res = await adminFetch('/admin/analytics/revenue-breakdown', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: { byOrganizer: RevenueByOrganizer[]; byEvent: RevenueByEvent[] }; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getApplicationsAction(
  accessToken: string,
  status?: 'pending' | 'approved' | 'rejected',
  page = 1
): Promise<ActionResult<{ applications: OrganizerApplicationDTO[]; total: number; totalPages: number }>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);

    const res = await adminFetch(`/admin/applications?${params.toString()}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as {
      success: boolean;
      data: OrganizerApplicationDTO[];
      meta: { total: number; totalPages: number; page: number; limit: number };
      error?: { message: string };
    };

    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: { applications: data.data, total: data.meta.total, totalPages: data.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getApplicationDetailAction(
  applicationId: string,
  accessToken: string
): Promise<ActionResult<OrganizerApplicationDTO>> {
  try {
    const res = await adminFetch(`/admin/applications/${applicationId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: OrganizerApplicationDTO; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Application not found' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function approveApplicationAction(applicationId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/applications/${applicationId}/approve`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed to approve' };
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
    const res = await adminFetch(`/admin/applications/${applicationId}/reject`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed to reject' };
    revalidatePath('/admin/applications');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

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

    const res = await adminFetch(`/admin/users?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminUserRow[];
      meta: { total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !result.success) return { success: false, error: result.error?.message ?? 'Failed' };
    return { success: true, data: { data: result.data, total: result.meta.total, totalPages: result.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getUserDetailAction(
  userId: string,
  accessToken: string
): Promise<ActionResult<{ user: AdminUserRow; profile: unknown; orderCount: number; eventCount: number }>> {
  try {
    const res = await adminFetch(`/admin/users/${userId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: { user: AdminUserRow; profile: unknown; orderCount: number; eventCount: number }; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Not found' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function suspendUserAction(userId: string, reason: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/users/${userId}/suspend`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/users');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function unsuspendUserAction(userId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/users/${userId}/unsuspend`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/users');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface AdminEventRow {
  id: string;
  title: string;
  slug: string;
  location: string;
  eventDate: string;
  isPublished: boolean;
  isFeatured: boolean;
  featureOrder: number | null;
  isCancelled: boolean;
  isFree: boolean;
  category: string | null;
  createdAt: string;
  organizerId: string;
  organizerName: string | null;
  organizerBusiness: string | null;
}

export async function getAdminEventsAction(
  accessToken: string,
  params: { page?: number; status?: string; search?: string }
): Promise<ActionResult<{ data: AdminEventRow[]; total: number; totalPages: number }>> {
  try {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: '20' });
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);

    const res = await adminFetch(`/admin/events?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminEventRow[];
      meta: { total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !result.success) return { success: false, error: result.error?.message ?? 'Failed' };
    return { success: true, data: { data: result.data, total: result.meta.total, totalPages: result.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function featureEventAction(
  eventId: string,
  isFeatured: boolean,
  featureOrder: number | null,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/events/${eventId}/feature`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ isFeatured, featureOrder }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function reorderFeaturedEventsAction(
  items: Array<{ id: string; featureOrder: number }>,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await adminFetch('/admin/events/reorder', accessToken, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function cancelAdminEventAction(eventId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/events/${eventId}/cancel`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  isFreeOrder: boolean;
  totalAmount: number;
  serviceFee: number;
  customerName: string;
  customerEmail: string;
  paidAt: string | null;
  createdAt: string;
  eventId: string | null;
  eventTitle: string | null;
  eventSlug: string | null;
}

export async function getAdminOrdersAction(
  accessToken: string,
  params: { page?: number; status?: string; search?: string }
): Promise<ActionResult<{ data: AdminOrderRow[]; total: number; totalPages: number }>> {
  try {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: '20' });
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);

    const res = await adminFetch(`/admin/orders?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminOrderRow[];
      meta: { total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !result.success) return { success: false, error: result.error?.message ?? 'Failed' };
    return { success: true, data: { data: result.data, total: result.meta.total, totalPages: result.meta.totalPages } };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getAdminOrderDetailAction(
  orderId: string,
  accessToken: string
): Promise<ActionResult<AdminOrderRow>> {
  try {
    const res = await adminFetch(`/admin/orders/${orderId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: AdminOrderRow; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Not found' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function refundOrderAction(orderId: string, reason: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(`/admin/orders/${orderId}/refund`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/orders');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface PlatformSettingsDTO {
  service_fee_percent: number;
  max_featured_events: number;
  event_categories: string[];
  platform_name: string;
  support_email: string;
}

export async function getAdminSettingsAction(accessToken: string): Promise<ActionResult<PlatformSettingsDTO>> {
  try {
    const res = await adminFetch('/admin/settings', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data: PlatformSettingsDTO; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function updateSettingAction(
  key: string,
  value: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await adminFetch('/admin/settings', accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { success: false, error: data.error?.message ?? 'Failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
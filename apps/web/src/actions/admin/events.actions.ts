import { adminFetch } from './index';
import { ActionResult } from './index';
import { revalidatePath } from 'next/cache';


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
): Promise<ActionResult<{ 
  data: AdminEventRow[]; total: number; totalPages: number }>> {
  try {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: '20' });
    if (params.status) qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    const res = await adminFetch(
      `/admin/events?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminEventRow[];
      meta: { total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !result.success) return { 
      success: false, error: result.error?.message ?? 'Failed' };
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

export async function featureEventAction(
  eventId: string,
  isFeatured: boolean,
  featureOrder: number | null,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/events/${eventId}/feature`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ isFeatured, featureOrder }),
    });
    const data = (await res.json()) as { 
      success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
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
    const data = (await res.json()) as { 
      success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function cancelAdminEventAction(
  eventId: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/events/${eventId}/cancel`, accessToken, { method: 'POST' });
    const data = (await res.json()) as { 
      success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
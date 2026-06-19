import { adminFetch } from './index';
import { ActionResult } from './index';
import { revalidatePath } from 'next/cache';

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

    const res = await adminFetch(
      `/admin/orders?${qs.toString()}`, accessToken, { cache: 'no-store' });
    const result = (await res.json()) as {
      success: boolean;
      data: AdminOrderRow[];
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

export async function getAdminOrderDetailAction(
  orderId: string,
  accessToken: string
): Promise<ActionResult<AdminOrderRow>> {
  try {
    const res = await adminFetch(
      `/admin/orders/${orderId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; 
      data: AdminOrderRow; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Not found' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function refundOrderAction(
  orderId: string, reason: string, accessToken: string): Promise<ActionResult> {
  try {
    const res = await adminFetch(
      `/admin/orders/${orderId}/refund`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = (await res.json()) as { 
      success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    revalidatePath('/admin/orders');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

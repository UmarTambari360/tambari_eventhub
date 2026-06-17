'use server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch(path: string, accessToken: string, options: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  publishedEvents: number;
  totalOrders: number;
  paidOrders: number;
}

export interface MonthlyRevenueStat {
  month: string;
  grossRevenue: number;
  platformFee: number;
  ticketsSold: number;
  orderCount: number;
}

export interface TicketTypeStat {
  ticketTypeId: string;
  name: string;
  price: number;
  quantity: number;
  quantitySold: number;
  revenue: number;
}

export interface OrganizerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  isFreeOrder: boolean;
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
}

export interface EventAttendee {
  id: string;
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  isRevoked: boolean;
  qrCodeUrl: string | null;
  ticketTypeName: string | null;
  orderNumber: string | null;
}

export async function getDashboardStatsAction(
  accessToken: string
): Promise<ActionResult<DashboardStats>> {
  try {
    const res = await apiFetch('/analytics/dashboard', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data?: DashboardStats; error?: { message: string } };
    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Failed to load stats' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getMonthlyRevenueAction(
  accessToken: string,
  months = 12
): Promise<ActionResult<MonthlyRevenueStat[]>> {
  try {
    const res = await apiFetch(`/analytics/revenue?months=${months}`, accessToken, {
      next: { revalidate: 300 },
    });
    const data = (await res.json()) as { success: boolean; data?: MonthlyRevenueStat[]; error?: { message: string } };
    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to load revenue data' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getEventTicketStatsAction(
  eventId: string,
  accessToken: string
): Promise<ActionResult<{ ticketStats: TicketTypeStat[] }>> {
  try {
    const res = await apiFetch(`/analytics/events/${eventId}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { success: boolean; data?: { ticketStats: TicketTypeStat[] }; error?: { message: string } };
    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to load event stats' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getEventAttendeesAction(
  eventId: string,
  accessToken: string,
  page = 1,
  search?: string
): Promise<ActionResult<{ items: EventAttendee[]; total: number; totalPages: number }>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await apiFetch(`/analytics/events/${eventId}/attendees?${params.toString()}`, accessToken, {
      cache: 'no-store',
    });
    const data = (await res.json()) as {
      success: boolean;
      data?: { items: EventAttendee[]; total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to load attendees' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getOrganizerOrdersAction(
  accessToken: string,
  page = 1,
  status?: string
): Promise<ActionResult<{ items: OrganizerOrder[]; total: number; totalPages: number }>> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    const res = await apiFetch(`/analytics/orders?${params.toString()}`, accessToken, {
      cache: 'no-store',
    });
    const data = (await res.json()) as {
      success: boolean;
      data?: { items: OrganizerOrder[]; total: number; totalPages: number };
      error?: { message: string };
    };
    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to load orders' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function checkInAttendeeAction(
  ticketCode: string,
  eventId: string,
  accessToken: string
): Promise<ActionResult<{ success: boolean; attendeeName: string; message: string }>> {
  try {
    const res = await apiFetch(`/orders/check-in?eventId=${eventId}`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ ticketCode }),
    });
    const data = (await res.json()) as {
      success: boolean;
      data?: { success: boolean; attendeeName: string; message: string };
      error?: { message: string };
    };
    if (!res.ok || !data.data) {
      return { success: false, error: data.error?.message ?? 'Check-in failed' };
    }
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function revokeTicketAction(
  attendeeId: string,
  reason: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await apiFetch(`/orders/attendees/${attendeeId}/revoke`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = (await res.json()) as { success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Revoke failed' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
'use server';

import type { CreateOrderInput } from '@eventhub/validators';
import type {
  OrderDTO,
  OrderListItemDTO,
  CreateOrderResponse,
  InitializePaymentResponse,
} from '@eventhub/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch(
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

// ─── Create order ─────────────────────────────────────────────────────────────

export async function createOrderAction(
  input: CreateOrderInput,
  accessToken: string
): Promise<ActionResult<CreateOrderResponse>> {
  try {
    const res = await apiFetch('/orders', accessToken, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: CreateOrderResponse;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Failed to create order.',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ─── Initialize payment ───────────────────────────────────────────────────────

export interface AttendeeInput {
  ticketTypeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

export async function initializePaymentAction(
  orderId: string,
  attendees: AttendeeInput[],
  accessToken: string
): Promise<ActionResult<InitializePaymentResponse>> {
  try {
    const res = await apiFetch(`/orders/${orderId}/pay`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ orderId, attendees }),
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: InitializePaymentResponse;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Failed to initialize payment.',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ─── Get order ────────────────────────────────────────────────────────────────

export async function getOrderAction(
  orderNumber: string,
  accessToken: string
): Promise<ActionResult<OrderDTO>> {
  try {
    const res = await apiFetch(`/orders/${orderNumber}`, accessToken, {
      cache: 'no-store',
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: OrderDTO;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Order not found.',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error.' };
  }
}

// ─── Verify payment ───────────────────────────────────────────────────────────

export async function verifyPaymentAction(
  orderNumber: string,
  accessToken: string
): Promise<ActionResult<{ status: string; message: string }>> {
  try {
    const res = await apiFetch(`/orders/${orderNumber}/verify`, accessToken, {
      method: 'POST',
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: { status: string; message: string };
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Verification failed.',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error.' };
  }
}

// ─── Get user orders ──────────────────────────────────────────────────────────

export async function getUserOrdersAction(
  accessToken: string,
  page = 1
): Promise<ActionResult<{ items: OrderListItemDTO[]; total: number; totalPages: number }>> {
  try {
    const res = await apiFetch(`/orders?page=${page}&limit=20`, accessToken, {
      cache: 'no-store',
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: { items: OrderListItemDTO[]; total: number; totalPages: number };
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Failed to load orders.' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error.' };
  }
}
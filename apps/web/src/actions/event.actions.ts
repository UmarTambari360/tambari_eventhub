'use server';

import { revalidatePath } from 'next/cache';
import type { CreateEventInput, UpdateEventInput } from '@eventhub/validators';
import type { EventDTO, EventListItemDTO, OrganizerEventDTO, PaginatedResponse } from '@eventhub/types';

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

// Organizer mutations 

export async function createEventAction(
  input: CreateEventInput,
  accessToken: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const res = await apiFetch('/events', accessToken, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: { id: string; slug: string };
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Failed to create event' };
    }

    revalidatePath('/dashboard/events');
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function updateEventAction(
  eventId: string,
  input: UpdateEventInput,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await apiFetch(`/events/${eventId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    const data = (await res.json()) as { success: boolean; error?: { message: string } };

    if (!res.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to update event' };
    }

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function publishEventAction(
  eventId: string,
  publish: boolean,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await apiFetch(`/events/${eventId}/publish`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ publish }),
    });

    const data = (await res.json()) as { success: boolean; error?: { message: string } };

    if (!res.ok || !data.success) {
      return { 
        success: false, error: data.error?.message ?? 'Failed to update publish status' };
    }

    revalidatePath('/dashboard/events');
    revalidatePath('/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function cancelEventAction(
  eventId: string,
  accessToken: string
): Promise<ActionResult> {
  try {
    const res = await apiFetch(`/events/${eventId}/cancel`, accessToken, {
      method: 'POST',
    });

    const data = (await res.json()) as { success: boolean; error?: { message: string } };

    if (!res.ok || !data.success) {
      return { success: false, error: data.error?.message ?? 'Failed to cancel event' };
    }

    revalidatePath('/dashboard/events');
    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ─── Organizer reads 

export async function getOrganizerEventsAction(
  accessToken: string,
  page = 1
): Promise<ActionResult<PaginatedResponse<OrganizerEventDTO>>> {
  try {
    const res = await apiFetch(
      `/events/organizer/list?page=${page}&limit=20`, accessToken, {
      cache: 'no-store',
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: PaginatedResponse<OrganizerEventDTO>;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Failed to fetch events' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getOrganizerEventDetailAction(
  eventId: string,
  accessToken: string
): Promise<ActionResult<OrganizerEventDTO>> {
  try {
    const res = await apiFetch(`/events/organizer/${eventId}`, accessToken, {
      cache: 'no-store',
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: OrganizerEventDTO;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Event not found' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ─── Public reads (Server Component helpers) 

export async function getPublishedEventsAction(
  params: Record<string, string> = {}): 
  Promise<ActionResult<PaginatedResponse<EventListItemDTO>>> {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/events?${qs}`, {
      next: { revalidate: 60 },
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: PaginatedResponse<EventListItemDTO>;
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to fetch events' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getEventBySlugAction(
  slug: string): Promise<ActionResult<EventDTO>> {
  try {
    const res = await fetch(`${API_URL}/events/${slug}`, {
      next: { revalidate: 300 },
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: EventDTO;
      error?: { message: string };
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: data.error?.message ?? 'Event not found' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getFeaturedEventsAction(): Promise<ActionResult<EventListItemDTO[]>> {
  try {
    const res = await fetch(`${API_URL}/events/featured`, {
      next: { revalidate: 600 },
    });

    const data = (await res.json()) as {
      success: boolean;
      data?: EventListItemDTO[];
    };

    if (!res.ok || !data.success || !data.data) {
      return { success: false, error: 'Failed to fetch featured events' };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
'use server';

import type { SubmitApplicationInput } from '@eventhub/validators';

const API_URL = process.env['NEXT_PUBLIC_API_URL'];

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function submitOrganizerApplicationAction(
  input: SubmitApplicationInput,
  accessToken: string
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const response = await fetch(`${API_URL}/organizer/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: { id: string; status: string };
      error?: { message: string };
    };

    if (!response.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Failed to submit application',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function getApplicationStatusAction(
  accessToken: string
): Promise<ActionResult<{
  status: string;
  businessName: string;
  submittedAt: string;
  rejectionReason: string | null;
} | null>> {
  try {
    const response = await fetch(`${API_URL}/organizer/application-status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    const data = (await response.json()) as {
      success: boolean;
      data: {
        status: string;
        businessName: string;
        submittedAt: string;
        rejectionReason: string | null;
      } | null;
    };

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Failed to fetch application status' };
  }
}

export async function getPaystackBanksAction(): Promise<
  ActionResult<Array<{ id: number; name: string; code: string }>>
> {
  try {
    const response = await fetch(`${API_URL}/organizer/banks`, {
      next: { revalidate: 86400 }, // 24 hours — banks rarely change
    });

    const data = (await response.json()) as {
      success: boolean;
      data: Array<{ id: number; name: string; code: string }>;
    };

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Failed to load banks' };
  }
}

export async function verifyBankAccountAction(
  accountNumber: string,
  bankCode: string,
  accessToken: string
): Promise<ActionResult<{ accountNumber: string; accountName: string }>> {
  try {
    const response = await fetch(`${API_URL}/organizer/verify-bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ accountNumber, bankCode }),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: { accountNumber: string; accountName: string };
      error?: { message: string };
    };

    if (!response.ok || !data.success || !data.data) {
      return {
        success: false,
        error: data.error?.message ?? 'Could not verify account',
      };
    }

    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Failed to verify account' };
  }
}
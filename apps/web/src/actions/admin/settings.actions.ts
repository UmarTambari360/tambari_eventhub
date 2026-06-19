import { adminFetch } from './index';
import { ActionResult } from './index';


export interface PlatformSettingsDTO {
  service_fee_percent: number;
  max_featured_events: number;
  event_categories: string[];
  platform_name: string;
  support_email: string;
}

export async function getAdminSettingsAction(
  accessToken: string): Promise<ActionResult<PlatformSettingsDTO>> {
  try {
    const res = await adminFetch(
      '/admin/settings', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; 
      data: PlatformSettingsDTO; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
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
    const data = (await res.json()) as { 
      success: boolean; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
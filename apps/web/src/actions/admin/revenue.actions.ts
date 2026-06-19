import { adminFetch, ActionResult } from './index';

export interface PlatformKPIs {
  gmv: { 
    allTime: number; thisMonth: number; 
    lastMonth: number; momGrowthPercent: number };
platformEarnings: { allTime: number; thisMonth: number };
  users: { 
    total: number; newThisMonth: number; 
    approvedOrganizers: number; pendingApplications: number };
  events: { 
    total: number; active: number; thisMonth: number };
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

export async function getPlatformKPIsAction(
  accessToken: string): Promise<ActionResult<PlatformKPIs>> {
  try {
    const res = await adminFetch(
      '/admin/analytics/kpis', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; data: PlatformKPIs; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
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
    const res = await adminFetch(
      `/admin/analytics/revenue-chart?months=${months}`, accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; data: MonthlyRevenuePoint[]; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getTopOrganizersAction(
  accessToken: string): Promise<ActionResult<TopOrganizer[]>> {
  try {
    const res = await adminFetch(
      '/admin/analytics/top-organizers', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; data: TopOrganizer[]; error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function getRevenueBreakdownAction(
  accessToken: string): Promise<ActionResult<{
  byOrganizer: RevenueByOrganizer[];
  byEvent: RevenueByEvent[];
}>> {
  try {
    const res = await adminFetch(
      '/admin/analytics/revenue-breakdown', accessToken, { cache: 'no-store' });
    const data = (await res.json()) as { 
      success: boolean; 
      data: { byOrganizer: RevenueByOrganizer[]; byEvent: RevenueByEvent[] }; 
      error?: { message: string } };
    if (!res.ok || !data.success) return { 
      success: false, error: data.error?.message ?? 'Failed' };
    return { success: true, data: data.data };
  } catch {
    return { success: false, error: 'Network error' };
  }
}



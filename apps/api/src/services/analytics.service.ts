import {
  queryPlatformKPIs,
  queryMonthlyPlatformEarnings,
  queryTopOrganizers,
  queryRecentTransactions,
  queryRevenueByOrganizer,
  queryRevenueByEvent,
} from '../db/queries/admin.queries.js';
import { cacheGet, cacheSet } from '../lib/redis.js';

const PLATFORM_STATS_CACHE_KEY = 'admin:platform:stats';
const PLATFORM_STATS_TTL = 5 * 60; // 5 min
const REVENUE_CHART_CACHE_KEY = 'admin:platform:revenue_chart';
const REVENUE_CHART_TTL = 10 * 60; // 10 min

export async function getPlatformKPIs() {
  const cached = await cacheGet(PLATFORM_STATS_CACHE_KEY);
  if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof queryPlatformKPIs>>;

  const data = await queryPlatformKPIs();
  await cacheSet(PLATFORM_STATS_CACHE_KEY, JSON.stringify(data), PLATFORM_STATS_TTL);
  return data;
}

export async function getMonthlyRevenueChart(months = 12) {
  const key = `${REVENUE_CHART_CACHE_KEY}:${months}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached) as Awaited<ReturnType<typeof queryMonthlyPlatformEarnings>>;

  const data = await queryMonthlyPlatformEarnings(months);
  await cacheSet(key, JSON.stringify(data), REVENUE_CHART_TTL);
  return data;
}

export async function getTopOrganizers(limit = 10) {
  return queryTopOrganizers(limit);
}

export async function getRecentTransactions(limit = 20) {
  return queryRecentTransactions(limit);
}

export async function getRevenueBreakdown() {
  const [byOrganizer, byEvent] = await Promise.all([
    queryRevenueByOrganizer(20),
    queryRevenueByEvent(20),
  ]);
  return { byOrganizer, byEvent };
}
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { platformSettings } from '../db/schema/index.js';
import { cacheGet, cacheSet, cacheDel } from '../lib/redis.js';
import { logger } from '../lib/logger.js';

const SETTINGS_CACHE_KEY = 'platform:settings';
const SETTINGS_CACHE_TTL = 3_600; // 1 hour

export interface PlatformSettingsMap {
  service_fee_percent: number;
  max_featured_events: number;
  event_categories: string[];
  platform_name: string;
  support_email: string;
}

/**
 * Load all platform settings as a typed map.
 * Redis → DB fallback. Cached for 1 hour.
 */
export async function getSettings(): Promise<PlatformSettingsMap> {
  const cached = await cacheGet(SETTINGS_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PlatformSettingsMap;
  }

  const rows = await db.select().from(platformSettings);

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  const settings: PlatformSettingsMap = {
    service_fee_percent: parseFloat(map['service_fee_percent'] ?? '2.5'),
    max_featured_events: parseInt(map['max_featured_events'] ?? '8', 10),
    event_categories: JSON.parse(map['event_categories'] ?? '[]') as string[],
    platform_name: map['platform_name'] ?? 'EventHub',
    support_email: map['support_email'] ?? 'support@eventhub.ng',
  };

  await cacheSet(SETTINGS_CACHE_KEY, JSON.stringify(settings), SETTINGS_CACHE_TTL);

  return settings;
}

/**
 * Get a single setting by key.
 */
export async function getSetting(key: keyof PlatformSettingsMap): Promise<PlatformSettingsMap[typeof key]> {
  const settings = await getSettings();
  return settings[key];
}

/**
 * Update a platform setting and invalidate the cache.
 */
export async function updateSetting(
  key: string,
  value: string,
  updatedBy: string
): Promise<void> {
  await db
    .update(platformSettings)
    .set({ value, updatedBy, updatedAt: new Date() })
    .where(eq(platformSettings.key, key));

  await invalidateSettingsCache();

  logger.info('Platform setting updated', { key, updatedBy });
}

/**
 * Invalidate the settings cache. Called after any setting update.
 */
export async function invalidateSettingsCache(): Promise<void> {
  await cacheDel(SETTINGS_CACHE_KEY);
}
import type { ReportData, ReportType, AiInsight, SectionId } from '../types';

const REPORT_CACHE_VERSION = 'v3';
const COMBINED_CACHE_KEY_PREFIX = 'ot_report_combined_cache_';
const COMBINED_CACHE_EXPIRY_KEY = 'ot_report_combined_cache_expiry_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type InsightMap = Partial<Record<SectionId, AiInsight>>;

export interface CachedReportWithInsights {
  reportData: ReportData;
  insights: InsightMap;
}

/**
 * Generate a unique cache key based on report config
 */
function getInsightsCacheKey(startDate: string, endDate: string, type: ReportType): string {
  const key = `${REPORT_CACHE_VERSION}_${startDate}_${endDate}_${type}`;
  return COMBINED_CACHE_KEY_PREFIX + key;
}

function getCombinedExpiryKey(startDate: string, endDate: string, type: ReportType): string {
  const key = `${REPORT_CACHE_VERSION}_${startDate}_${endDate}_${type}`;
  return COMBINED_CACHE_EXPIRY_KEY + key;
}

/**
 * Save both report data and AI insights to cache
 */
export function cacheReportWithInsights(
  startDate: string,
  endDate: string,
  type: ReportType,
  reportData: ReportData,
  insights: InsightMap
): void {
  try {
    const cacheKey = getInsightsCacheKey(startDate, endDate, type);
    const expiryKey = getCombinedExpiryKey(startDate, endDate, type);

    const combined: CachedReportWithInsights = {
      reportData,
      insights,
    };

    localStorage.setItem(cacheKey, JSON.stringify(combined));
    localStorage.setItem(expiryKey, JSON.stringify(Date.now() + CACHE_TTL_MS));
  } catch (err) {
    console.warn('Failed to cache report with insights:', err);
  }
}

/**
 * Retrieve cached report data with AI insights
 */
export function getCachedReportWithInsights(
  startDate: string,
  endDate: string,
  type: ReportType
): CachedReportWithInsights | null {
  try {
    const cacheKey = getInsightsCacheKey(startDate, endDate, type);
    const expiryKey = getCombinedExpiryKey(startDate, endDate, type);

    const expiryTime = localStorage.getItem(expiryKey);
    if (!expiryTime) return null;

    const expiry = JSON.parse(expiryTime);
    if (Date.now() > expiry) {
      // Cache expired
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
      return null;
    }

    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    return JSON.parse(cached) as CachedReportWithInsights;
  } catch (err) {
    console.warn('Failed to retrieve cached report with insights:', err);
    return null;
  }
}

/**
 * Save only AI insights (for partial updates)
 */
export function cacheInsights(
  startDate: string,
  endDate: string,
  type: ReportType,
  insights: InsightMap
): void {
  try {
    const cacheKey = getInsightsCacheKey(startDate, endDate, type);
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const combined = JSON.parse(cached) as CachedReportWithInsights;
      const updated: CachedReportWithInsights = {
        ...combined,
        insights,
      };
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('Failed to update cached insights:', err);
  }
}

/**
 * Clear specific report cache
 */
export function clearCombinedCache(startDate?: string, endDate?: string, type?: ReportType): void {
  try {
    if (startDate && endDate && type) {
      const cacheKey = getInsightsCacheKey(startDate, endDate, type);
      const expiryKey = getCombinedExpiryKey(startDate, endDate, type);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
    } else {
      // Clear all combined caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(COMBINED_CACHE_KEY_PREFIX) || key.startsWith(COMBINED_CACHE_EXPIRY_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to clear combined cache:', err);
  }
}

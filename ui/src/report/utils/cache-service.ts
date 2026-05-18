import type { ReportData, ReportConfig, ReportType } from '../types';

const REPORT_CACHE_VERSION = 'v3';
const CACHE_KEY_PREFIX = 'ot_report_cache_';
const CACHE_EXPIRY_KEY = 'ot_report_cache_expiry_';
const LAST_REPORT_KEY = 'ot_last_report_dates';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a unique cache key based on report config (start, end, type)
 */
function getCacheKey(config: Partial<ReportConfig>): string {
  const key = `${REPORT_CACHE_VERSION}_${config.startDate}_${config.endDate}_${config.type}`;
  return CACHE_KEY_PREFIX + key;
}

function getCacheExpiryKey(config: Partial<ReportConfig>): string {
  const key = `${REPORT_CACHE_VERSION}_${config.startDate}_${config.endDate}_${config.type}`;
  return CACHE_EXPIRY_KEY + key;
}

/**
 * Save report data to cache
 */
export function cacheReportData(config: Partial<ReportConfig>, data: ReportData): void {
  try {
    const cacheKey = getCacheKey(config);
    const expiryKey = getCacheExpiryKey(config);
    
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(expiryKey, JSON.stringify(Date.now() + CACHE_TTL_MS));
  } catch (err) {
    console.warn('Failed to cache report data:', err);
  }
}

/**
 * Retrieve cached report data
 */
export function getCachedReportData(config: Partial<ReportConfig>): ReportData | null {
  try {
    const cacheKey = getCacheKey(config);
    const expiryKey = getCacheExpiryKey(config);
    
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
    
    return JSON.parse(cached) as ReportData;
  } catch (err) {
    console.warn('Failed to retrieve cached report data:', err);
    return null;
  }
}

/**
 * Clear specific report cache
 */
export function clearReportCache(config?: Partial<ReportConfig>): void {
  try {
    if (config) {
      const cacheKey = getCacheKey(config);
      const expiryKey = getCacheExpiryKey(config);
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
    } else {
      // Clear all report caches
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_EXPIRY_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (err) {
    console.warn('Failed to clear report cache:', err);
  }
}

/**
 * Get list of all cached reports with their metadata
 */
export function getCachedReportsList(): Array<{ config: string; cachedAt: string }> {
  try {
    const reports: Array<{ config: string; cachedAt: string }> = [];
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const reportKey = key.replace(CACHE_KEY_PREFIX, '');
        const expiryKey = CACHE_EXPIRY_KEY + reportKey;
        const expiryTime = localStorage.getItem(expiryKey);
        
        if (expiryTime) {
          const expiry = JSON.parse(expiryTime);
          if (Date.now() <= expiry) {
            reports.push({
              config: reportKey,
              cachedAt: new Date(Date.now()).toISOString(),
            });
          }
        }
      }
    });
    
    return reports;
  } catch (err) {
    console.warn('Failed to get cached reports list:', err);
    return [];
  }
}

/**
 * Save the last used report dates/type
 */
export function saveLastReportDates(startDate: string, endDate: string, type: ReportType): void {
  try {
    localStorage.setItem(LAST_REPORT_KEY, JSON.stringify({ startDate, endDate, type }));
  } catch (err) {
    console.warn('Failed to save last report dates:', err);
  }
}

/**
 * Get the last used report dates/type
 */
export function getLastReportDates(): { startDate: string; endDate: string; type: ReportType } | null {
  try {
    const last = localStorage.getItem(LAST_REPORT_KEY);
    if (!last) return null;
    return JSON.parse(last) as { startDate: string; endDate: string; type: ReportType };
  } catch (err) {
    console.warn('Failed to get last report dates:', err);
    return null;
  }
}

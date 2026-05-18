import { useState, useCallback } from 'react';
import { fetchAllReportData, type AllReportDataResult } from '../api/report-queries';
import type { ReportConfig, ReportData, ReportType } from '../types';
import { DEFAULT_CLIENT_NAME } from '../constants';
import { getCachedReportData, cacheReportData, saveLastReportDates, getLastReportDates } from '../utils/cache-service';
import { getCachedReportWithInsights, cacheReportWithInsights, type InsightMap } from '../utils/combined-cache-service';

export function useReportData() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [failedEndpoints, setFailedEndpoints] = useState<string[]>([]);

  const generateReport = useCallback(async (startDate: string, endDate: string, type: ReportType = 'monthly', forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    setIsCached(false);
    setFailedEndpoints([]);

    // Clear existing report data so the UI fully reloads when forcing a refresh
    if (forceRefresh) {
      setData(null);
    }
    
    const config: ReportConfig = { type, startDate, endDate, clientName: DEFAULT_CLIENT_NAME, generatedAt: new Date().toISOString() };
    
    // Check combined cache first (data + insights) — skip if force refresh
    if (!forceRefresh) {
      const cachedCombined = getCachedReportWithInsights(startDate, endDate, type);
      if (cachedCombined) {
        setData(cachedCombined.reportData);
        setIsCached(true);
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const result: AllReportDataResult = await fetchAllReportData({ customStart: startDate, customEnd: endDate });
      const { failedEndpoints: failed, ...resultData } = result;
      const fullData: ReportData = { config, ...resultData, isLoading: false, error: null };
      setData(fullData);
      setFailedEndpoints(failed);
      
      // Cache the data and save the dates
      cacheReportData(config, fullData);
      saveLastReportDates(startDate, endDate, type);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch report data';
      setError(msg);
      setData({
        config,
        powerKpis: null,
        powerTrend: null,
        environmentalSignals: null,
        telemetryProfile: null,
        reportingCadence: null,
        telemetryCoverage: null,
        latestStatus: null,
        commKpis: null,
        commFlow: null,
        commTopFlows: null,
        modbusResponseTime: null,
        modbusRequestsErrors: null,
        modbusUnitHealth: null,
        securityKpis: null,
        securityEventsOverTime: null,
        securityVerdictDist: null,
        securityTopRisky: null,
        deviceMappings: null,
        detectionRules: null,
        detectionIncidents: null,
        isLoading: false,
        error: msg,
      });
    } finally { setIsLoading(false); }
  }, []);

  const loadCachedReport = useCallback((config: Partial<ReportConfig>) => {
    const cachedData = getCachedReportData(config);
    if (cachedData) {
      setData(cachedData);
      setIsCached(true);
      return true;
    }
    return false;
  }, []);

  const restoreLastReport = useCallback(() => {
    const lastDates = getLastReportDates();
    if (lastDates) {
      const cachedCombined = getCachedReportWithInsights(lastDates.startDate, lastDates.endDate, lastDates.type);
      if (cachedCombined) {
        setData(cachedCombined.reportData);
        setIsCached(true);
        return cachedCombined.reportData.config;
      }
    }
    return null;
  }, []);

  const getCachedInsights = useCallback(() => {
    if (data && data.config) {
      const cachedCombined = getCachedReportWithInsights(data.config.startDate, data.config.endDate, data.config.type);
      return cachedCombined?.insights || null;
    }
    return null;
  }, [data]);

  const cacheInsightsForCurrentReport = useCallback((insights: InsightMap) => {
    if (data && data.config) {
      cacheReportWithInsights(data.config.startDate, data.config.endDate, data.config.type, data, insights);
    }
  }, [data]);

  return { data, isLoading, error, generateReport, isCached, failedEndpoints, loadCachedReport, restoreLastReport, cacheInsightsForCurrentReport, getCachedInsights };
}

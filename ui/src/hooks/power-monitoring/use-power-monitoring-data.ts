import {
  powerMonitoringEnvironmentalSignalsQuery,
  powerMonitoringKpisQuery,
  powerMonitoringLatestStatusQuery,
  powerMonitoringPowerTrendQuery,
  powerMonitoringReportingCadenceQuery,
  powerMonitoringTelemetryCoverageQuery,
  powerMonitoringTelemetryProfileQuery,
} from "@/api/queries";
import {
  POWER_MONITORING_KPI_CARD_TEMPLATES,
  buildPowerMonitoringEnvironmentalSignalsChartData,
  buildPowerMonitoringLatestStatusData,
  buildPowerMonitoringPowerTrendChartData,
  buildPowerMonitoringReportingCadenceData,
  buildPowerMonitoringTelemetryCoverageData,
  buildPowerMonitoringTelemetryProfileData,
  getDashboardTimeRangeQueryParams,
} from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

export default function usePowerMonitoringData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams] = useSearchParams();

  const { customStart, customEnd, timeRange } = useMemo(
    () => getDashboardTimeRangeQueryParams(searchParams),
    [searchParams],
  );

  const {
    data: kpisData,
    isFetching: kpisPending,
    isError: kpisHasError,
    error: kpisError,
    refetch: kpisRefetching,
  } = useQuery(powerMonitoringKpisQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const { data: powerTrendData, isFetching: powerTrendPending, refetch: powerTrendRefetching } = useQuery(powerMonitoringPowerTrendQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const {
    data: environmentalSignalsData,
    isFetching: environmentalSignalsPending,
    refetch: environmentalSignalsRefetching,
  } = useQuery(powerMonitoringEnvironmentalSignalsQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const {
    data: telemetryProfileData,
    isFetching: telemetryProfilePending,
    refetch: telemetryProfileRefetching,
  } = useQuery(powerMonitoringTelemetryProfileQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const {
    data: reportingCadenceData,
    isFetching: reportingCadencePending,
    refetch: reportingCadenceRefetching,
  } = useQuery(powerMonitoringReportingCadenceQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const {
    data: telemetryCoverageData,
    isFetching: telemetryCoveragePending,
    refetch: telemetryCoverageRefetching,
  } = useQuery(powerMonitoringTelemetryCoverageQuery({
    timeRange,
    customStart,
    customEnd,
  }));
  const {
    data: latestStatusData,
    isFetching: latestStatusPending,
    refetch: latestStatusRefetching,
  } = useQuery(powerMonitoringLatestStatusQuery({
    timeRange,
    customStart,
    customEnd,
  }));

  const powerTrend = useMemo(
    () => buildPowerMonitoringPowerTrendChartData(powerTrendData?.points ?? []),
    [powerTrendData?.points],
  );
  const environmentalSignals = useMemo(
    () => buildPowerMonitoringEnvironmentalSignalsChartData(environmentalSignalsData?.points ?? []),
    [environmentalSignalsData?.points],
  );
  const telemetryProfile = useMemo(
    () => buildPowerMonitoringTelemetryProfileData(telemetryProfileData?.items ?? []),
    [telemetryProfileData?.items],
  );
  const reportingCadence = useMemo(
    () => buildPowerMonitoringReportingCadenceData(reportingCadenceData?.points ?? [], reportingCadenceData?.time_range ?? timeRange),
    [reportingCadenceData?.points, reportingCadenceData?.time_range, timeRange],
  );
  const telemetryCoverage = useMemo(
    () => buildPowerMonitoringTelemetryCoverageData(telemetryCoverageData?.items ?? []),
    [telemetryCoverageData?.items],
  );
  const latestStatus = useMemo(
    () => buildPowerMonitoringLatestStatusData(latestStatusData?.rows ?? []),
    [latestStatusData?.rows],
  );

  const kpisErrorMessage = useMemo(
    () => getApiErrorMessage(kpisError, "Unable to load KPI data right now."),
    [kpisError],
  );

  const kpiMetrics = useMemo<PowerMetricCard[]>(() => {
    if (kpisData?.metrics?.length) {
      return kpisData.metrics;
    }

    if (kpisHasError) {
      return POWER_MONITORING_KPI_CARD_TEMPLATES.map((metric) => ({
        ...metric,
        value: "N/A",
        delta: "Data unavailable",
        helper: kpisErrorMessage,
        trend: "steady",
      }));
    }

    return POWER_MONITORING_KPI_CARD_TEMPLATES;
  }, [kpisData?.metrics, kpisHasError, kpisErrorMessage]);

  const refreshPowerMonitoring = async () => {

    await Promise.all([
      kpisRefetching(),
      powerTrendRefetching(),
      environmentalSignalsRefetching(),
      telemetryProfileRefetching(),
      reportingCadenceRefetching(),
      telemetryCoverageRefetching(),
      latestStatusRefetching(),
    ]);
  };

  return {
    customStart,
    customEnd,
    timeRange,
    isRefreshing,
    setIsRefreshing,
    refreshPowerMonitoring,
    isLoading: isRefreshing || kpisPending || powerTrendPending || environmentalSignalsPending || telemetryProfilePending || reportingCadencePending || telemetryCoveragePending || latestStatusPending,
    isKpisLoading: kpisPending || isRefreshing,
    isKpisError: kpisHasError,
    kpisErrorMessage,
    isPowerTrendLoading: isRefreshing || powerTrendPending,
    isEnvironmentalSignalsLoading: isRefreshing || environmentalSignalsPending,
    isTelemetryProfileLoading: isRefreshing || telemetryProfilePending,
    isReportingCadenceLoading: isRefreshing || reportingCadencePending,
    isTelemetryCoverageLoading: isRefreshing || telemetryCoveragePending,
    isLatestStatusLoading: isRefreshing || latestStatusPending,
    kpiMetrics,
    powerTrend,
    environmentalSignals,
    telemetryProfile,
    reportingCadence,
    telemetryCoverage,
    latestStatus,
  };
}

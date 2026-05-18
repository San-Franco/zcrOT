import { QueryClient, queryOptions } from "@tanstack/react-query";
import api from "..";
import { resolveTelemetryBasePath } from "../openapi-capabilities";

const POWER_MONITORING_BACKGROUND_REFRESH_MS = 30_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const checkSession = async () => {
  const res = await api.get("auth/check-session")

  return res.data
}

export const checkSessionQuery = () => queryOptions({
  queryKey: ["check-session"],
  queryFn: checkSession,
})

export const invalidatePortQueries = async () => {
  await queryClient.invalidateQueries({ queryKey: ["ports"] });
  return null
}

const fetchPorts = async (params: FetchPortsParams = {}) => {
  const res = await api.get<PortListResponse>("/ports", {
    params: {
      search: params.search,
      status: params.status,
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    },
  });

  return res.data
}

const fetchTelemetryEndpoint = async <T>(
  endpoint: string,
  params: FetchPowerMonitoringKpisParams = {},
) => {
  const basePath = await resolveTelemetryBasePath();
  const res = await api.get<T>(`${basePath}/${endpoint}`, {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

export const portsQuery = ({ search, status, skip, limit }: {
  search?: string,
  status?: string,
  skip?: number,
  limit?: number
}) => queryOptions({
  queryKey: ['ports', search ?? undefined, status ?? undefined, skip ?? undefined, limit ?? undefined],
  queryFn: () => fetchPorts({ search, status, skip, limit })
})

const fetchPowerMonitoringKpis = async (params: FetchPowerMonitoringKpisParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringKpisResponse>("kpis", params);
}

export const powerMonitoringKpisQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringKpisParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-kpis", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringKpis({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringPowerTrend = async (params: FetchPowerMonitoringPowerTrendParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringPowerTrendResponse>("power-trend", params);
}

export const powerMonitoringPowerTrendQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringPowerTrendParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-power-trend", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringPowerTrend({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringEnvironmentalSignals = async (params: FetchPowerMonitoringEnvironmentalSignalsParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringEnvironmentalSignalsResponse>("environmental-signals", params);
}

export const powerMonitoringEnvironmentalSignalsQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringEnvironmentalSignalsParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-environmental-signals", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringEnvironmentalSignals({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringTelemetryProfile = async (params: FetchPowerMonitoringTelemetryProfileParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringTelemetryProfileResponse>("telemetry-profile", params);
}

export const powerMonitoringTelemetryProfileQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringTelemetryProfileParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-telemetry-profile", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringTelemetryProfile({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringReportingCadence = async (params: FetchPowerMonitoringReportingCadenceParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringReportingCadenceResponse>("reporting-cadence", params);
}

export const powerMonitoringReportingCadenceQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringReportingCadenceParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-reporting-cadence", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringReportingCadence({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringTelemetryCoverage = async (params: FetchPowerMonitoringTelemetryCoverageParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringTelemetryCoverageResponse>("telemetry-coverage", params);
}

export const powerMonitoringTelemetryCoverageQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringTelemetryCoverageParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-telemetry-coverage", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringTelemetryCoverage({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })

const fetchPowerMonitoringLatestStatus = async (params: FetchPowerMonitoringLatestStatusParams = {}) => {
  return fetchTelemetryEndpoint<PowerMonitoringLatestStatusResponse>("latest-status", params);
}

export const powerMonitoringLatestStatusQuery = ({ timeRange, customStart, customEnd }: FetchPowerMonitoringLatestStatusParams = {}) =>
  queryOptions({
    queryKey: ["power-monitoring-latest-status", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchPowerMonitoringLatestStatus({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: POWER_MONITORING_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  })


export default queryClient;

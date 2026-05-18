import axios from "axios";
import { queryOptions } from "@tanstack/react-query";
import api from "..";
import { apiHasPath } from "../openapi-capabilities";

const OT_SECURITY_EXPOSURE_BACKGROUND_REFRESH_MS = 30_000;
const DEFAULT_OT_SECURITY_EXPOSURE_FILTERS: OtSecurityExposureFiltersResponse = {
  protocols: [{ name: "All Protocols", value: "all" }],
  severity: [{ name: "All Severity", value: "all" }],
  verdict: [{ name: "All Verdict", value: "all" }],
  identity: [{ name: "All Identity", value: "all" }],
};

const fetchOtSecurityExposureKpis = async (params: FetchOtSecurityExposureKpisParams = {}) => {
  const res = await api.get<OtSecurityExposureKpisResponse>("/ot-security-exposure/kpis", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtSecurityExposureEventsOverTime = async (
  params: FetchOtSecurityExposureEventsOverTimeParams = {},
) => {
  const res = await api.get<OtSecurityExposureEventsOverTimeResponse>("/ot-security-exposure/events-over-time", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtSecurityExposureVerdictDistribution = async (
  params: FetchOtSecurityExposureVerdictDistributionParams = {},
) => {
  const res = await api.get<OtSecurityExposureVerdictDistributionResponse>("/ot-security-exposure/verdict-distribution", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtSecurityExposureTopRiskySources = async (
  params: FetchOtSecurityExposureTopRiskySourcesParams = {},
) => {
  const res = await api.get<OtSecurityExposureTopRiskySourcesResponse>("/ot-security-exposure/top-risky-sources", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtSecurityExposureFilters = async (params: FetchOtSecurityExposureFiltersParams = {}) => {
  if (!(await apiHasPath("/api/v1/filters"))) {
    return DEFAULT_OT_SECURITY_EXPOSURE_FILTERS;
  }

  try {
    const res = await api.get<OtSecurityExposureFiltersResponse>("/filters", {
      params: {
        timeRange: params.timeRange ?? "1h",
        customStart: params.customStart ?? undefined,
        customEnd: params.customEnd ?? undefined,
      },
    });

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return DEFAULT_OT_SECURITY_EXPOSURE_FILTERS;
    }

    return DEFAULT_OT_SECURITY_EXPOSURE_FILTERS;
  }
};

const fetchOtSecurityExposureLiveEventsInfinite = async ({
  pageParam = 0,
  limit = 50,
  timeRange,
  customStart,
  customEnd,
  source,
  destination,
  protocol,
  identity,
  severity,
  verdict,
}: {
  pageParam?: number;
} & FetchOtSecurityExposureLiveEventsParams): Promise<OtSecurityExposureLiveEventsResponse> => {
  const res = await api.get<OtSecurityExposureLiveEventsResponse>("/ot-security-exposure/live-security-events", {
    params: {
      offset: pageParam,
      limit,
      timeRange: timeRange ?? "1h",
      customStart: customStart ?? undefined,
      customEnd: customEnd ?? undefined,
      source: source?.trim() ? source : undefined,
      destination: destination?.trim() ? destination : undefined,
      protocol: protocol ?? undefined,
      identity: identity ?? undefined,
      severity: severity ?? undefined,
      verdict: verdict ?? undefined,
    },
  });

  return res.data;
};

export const otSecurityExposureKpisQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtSecurityExposureKpisParams = {}) =>
  queryOptions({
    queryKey: ["ot-security-exposure-kpis", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtSecurityExposureKpis({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_SECURITY_EXPOSURE_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otSecurityExposureEventsOverTimeQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtSecurityExposureEventsOverTimeParams = {}) =>
  queryOptions({
    queryKey: ["ot-security-exposure-events-over-time", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtSecurityExposureEventsOverTime({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_SECURITY_EXPOSURE_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otSecurityExposureVerdictDistributionQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtSecurityExposureVerdictDistributionParams = {}) =>
  queryOptions({
    queryKey: ["ot-security-exposure-verdict-distribution", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtSecurityExposureVerdictDistribution({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_SECURITY_EXPOSURE_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otSecurityExposureTopRiskySourcesQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtSecurityExposureTopRiskySourcesParams = {}) =>
  queryOptions({
    queryKey: ["ot-security-exposure-top-risky-sources", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtSecurityExposureTopRiskySources({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_SECURITY_EXPOSURE_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otSecurityExposureFiltersQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtSecurityExposureFiltersParams = {}) =>
  queryOptions({
    queryKey: ["ot-security-exposure-filters", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () =>
      fetchOtSecurityExposureFilters({
        timeRange,
        customStart,
        customEnd,
      }),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

export const otSecurityExposureLiveEventsInfiniteQuery = ({
  limit = 50,
  timeRange,
  customStart,
  customEnd,
  source,
  destination,
  protocol,
  identity,
  severity,
  verdict,
}: FetchOtSecurityExposureLiveEventsParams = {}) => ({
  queryKey: [
    "ot-security-exposure-live-events",
    "infinite",
    limit,
    timeRange ?? "1h",
    customStart ?? undefined,
    customEnd ?? undefined,
    source ?? undefined,
    destination ?? undefined,
    protocol ?? undefined,
    identity ?? undefined,
    severity ?? undefined,
    verdict ?? undefined,
  ],
  queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
    fetchOtSecurityExposureLiveEventsInfinite({
      pageParam,
      limit,
      timeRange,
      customStart,
      customEnd,
      source,
      destination,
      protocol,
      identity,
      severity,
      verdict,
    }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: OtSecurityExposureLiveEventsResponse) => {
    if (lastPage.has_more) {
      const currentOffset = lastPage.page > 0 ? (lastPage.page - 1) * lastPage.per_page : 0;
      return currentOffset + lastPage.per_page;
    }

    return undefined;
  },
  staleTime: 30_000,
  gcTime: 5 * 60 * 1000,
});

import {
  otSecurityExposureEventsOverTimeQuery,
  otSecurityExposureKpisQuery,
  otSecurityExposureLiveEventsInfiniteQuery,
  otSecurityExposureTopRiskySourcesQuery,
  otSecurityExposureVerdictDistributionQuery,
} from "@/api/queries/security-exposure-queries";
import {
  buildOtSecurityExposureKpiCards,
  buildOtSecurityExposureLiveEvents,
  buildOtSecurityExposureSeverityTrendRows,
  buildOtSecurityExposureTopRiskRows,
  buildOtSecurityExposureVerdictTrendRows,
  extractSecurityExposureErrorMessage,
  getDashboardTimeRangeQueryParams,
  getLiveSecurityEventFilterQueryParams,
  getLiveSecurityEventRowLimit,
} from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

export default function useOTSecurityExposureData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams] = useSearchParams();

  const { customStart, customEnd, timeRange } = useMemo(
    () => getDashboardTimeRangeQueryParams(searchParams),
    [searchParams],
  );
  const liveEventFilters = useMemo(
    () => getLiveSecurityEventFilterQueryParams(searchParams),
    [searchParams],
  );
  const liveEventRowsLimit = useMemo(
    () => getLiveSecurityEventRowLimit(searchParams),
    [searchParams],
  );

  const {
    data: securityKpisResponse,
    isFetching: securityKpisPending,
    isError: securityKpisHasError,
    error: securityKpisError,
    refetch: securityKpisRefetching,
  } = useQuery(
    otSecurityExposureKpisQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: eventsOverTimeResponse,
    isFetching: eventsOverTimePending,
    isError: eventsOverTimeHasError,
    error: eventsOverTimeError,
    refetch: eventsOverTimeRefetching,
  } = useQuery(
    otSecurityExposureEventsOverTimeQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: verdictDistributionResponse,
    isFetching: verdictDistributionPending,
    isError: verdictDistributionHasError,
    error: verdictDistributionError,
    refetch: verdictDistributionRefetching,
  } = useQuery(
    otSecurityExposureVerdictDistributionQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: topRiskySourcesResponse,
    isFetching: topRiskySourcesPending,
    isError: topRiskySourcesHasError,
    error: topRiskySourcesError,
    refetch: topRiskySourcesRefetching,
  } = useQuery(
    otSecurityExposureTopRiskySourcesQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: liveEventsResponse,
    status: liveEventsStatus,
    error: liveEventsError,
    isFetchingNextPage: isLiveEventsFetchingNextPage,
    fetchNextPage: fetchLiveEventsNextPage,
    hasNextPage: hasLiveEventsNextPage,
    refetch: liveEventsRefetching,
  } = useInfiniteQuery(
    otSecurityExposureLiveEventsInfiniteQuery({
      limit: liveEventRowsLimit,
      timeRange,
      customStart,
      customEnd,
      source: liveEventFilters.source,
      destination: liveEventFilters.destination,
      protocol: liveEventFilters.protocol,
      identity: liveEventFilters.identity,
      severity: liveEventFilters.severity,
      verdict: liveEventFilters.verdict,
    }),
  );

  const securityKpiCards = useMemo(
    () => buildOtSecurityExposureKpiCards(securityKpisResponse?.metrics),
    [securityKpisResponse?.metrics],
  );

  const kpisErrorMessage = useMemo(
    () => extractSecurityExposureErrorMessage(securityKpisError, "Unable to load security KPI data right now."),
    [securityKpisError],
  );

  const eventsOverTimeErrorMessage = useMemo(
    () => extractSecurityExposureErrorMessage(eventsOverTimeError, "Unable to load events over time data right now."),
    [eventsOverTimeError],
  );

  const verdictDistributionErrorMessage = useMemo(
    () => extractSecurityExposureErrorMessage(verdictDistributionError, "Unable to load verdict distribution data right now."),
    [verdictDistributionError],
  );

  const topRiskySourcesErrorMessage = useMemo(
    () => extractSecurityExposureErrorMessage(topRiskySourcesError, "Unable to load top risky sources data right now."),
    [topRiskySourcesError],
  );

  const liveEventsErrorMessage = useMemo(
    () => extractSecurityExposureErrorMessage(liveEventsError, "Unable to load live security events right now."),
    [liveEventsError],
  );

  const severityTrendRows = useMemo(
    () => buildOtSecurityExposureSeverityTrendRows(eventsOverTimeResponse?.rows ?? []),
    [eventsOverTimeResponse?.rows],
  );

  const verdictTrendRows = useMemo(
    () => buildOtSecurityExposureVerdictTrendRows(verdictDistributionResponse?.rows ?? []),
    [verdictDistributionResponse?.rows],
  );

  const topRiskRows = useMemo(
    () => buildOtSecurityExposureTopRiskRows(topRiskySourcesResponse?.rows ?? []),
    [topRiskySourcesResponse?.rows],
  );

  const networkEvents = useMemo(
    () => buildOtSecurityExposureLiveEvents(
      liveEventsResponse?.pages.flatMap((page) => page.rows) ?? [],
    ),
    [liveEventsResponse?.pages],
  );

  const refreshOTSecurityExposure = async () => {

    await Promise.all([
      securityKpisRefetching(),
      eventsOverTimeRefetching(),
      verdictDistributionRefetching(),
      topRiskySourcesRefetching(),
      liveEventsRefetching(),
    ]);
  };

  return {
    customStart,
    customEnd,
    timeRange,
    isRefreshing,
    setIsRefreshing,
    refreshOTSecurityExposure,
    isLoading: isRefreshing || securityKpisPending || eventsOverTimePending || verdictDistributionPending || topRiskySourcesPending || liveEventsStatus === "pending",
    isKpisLoading: isRefreshing || securityKpisPending,
    isEventsOverTimeLoading: isRefreshing || eventsOverTimePending,
    isVerdictDistributionLoading: isRefreshing || verdictDistributionPending,
    isTopRiskySourcesLoading: isRefreshing || topRiskySourcesPending,
    isLiveEventsLoading: isRefreshing || liveEventsStatus === "pending",
    isKpisError: securityKpisHasError,
    isEventsOverTimeError: eventsOverTimeHasError,
    isVerdictDistributionError: verdictDistributionHasError,
    isTopRiskySourcesError: topRiskySourcesHasError,
    isLiveEventsError: liveEventsStatus === "error",
    hasLiveEventsNextPage: hasLiveEventsNextPage ?? false,
    isLiveEventsFetchingNextPage,
    fetchLiveEventsNextPage,
    refetchLiveEvents: liveEventsRefetching,
    kpisErrorMessage,
    eventsOverTimeErrorMessage,
    verdictDistributionErrorMessage,
    topRiskySourcesErrorMessage,
    liveEventsErrorMessage,
    securityKpiCards,
    networkEvents,
    severityTrendRows,
    verdictTrendRows,
    topRiskRows,
  };
}

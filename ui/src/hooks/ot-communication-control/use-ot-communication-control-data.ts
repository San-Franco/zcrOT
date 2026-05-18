import {
  otCommunicationControlFlowQuery,
  otCommunicationControlKpisQuery,
  otCommunicationControlSmartloggerTopologyFlowQuery,
  otCommunicationControlModbusRequestsErrorsQuery,
  otCommunicationControlModbusResponseTimeQuery,
  otCommunicationControlModbusUnitHealthQuery,
  otCommunicationControlTopFlowsInfiniteQuery,
} from "@/api/queries/communication-control-queries";
import {
  buildOtCommunicationSmartloggerTopologyRows,
  buildOtCommunicationTopFlowRows,
  extractOtCommunicationErrorMessage,
  formatOtCommunicationBucketLabel,
  getDashboardTimeRangeQueryParams,
  getTopCommunicationFlowFilterQueryParams,
  getTopCommunicationFlowRowLimit,
} from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

export default function useOTCommunicationControlData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchParams] = useSearchParams();

  const { customStart, customEnd, timeRange } = useMemo(
    () => getDashboardTimeRangeQueryParams(searchParams),
    [searchParams],
  );
  const topFlowFilters = useMemo(
    () => getTopCommunicationFlowFilterQueryParams(searchParams),
    [searchParams],
  );
  const topFlowRowsLimit = useMemo(
    () => getTopCommunicationFlowRowLimit(searchParams),
    [searchParams],
  );

  const {
    data: communicationKpisResponse,
    isFetching: communicationKpisPending,
    isError: communicationKpisHasError,
    error: communicationKpisError,
    refetch: communicationKpisRefetching,
  } = useQuery(
    otCommunicationControlKpisQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: communicationFlowResponse,
    isFetching: communicationFlowPending,
    isError: communicationFlowHasError,
    error: communicationFlowError,
    refetch: communicationFlowRefetching,
  } = useQuery(
    otCommunicationControlFlowQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: topCommunicationFlowsResponse,
    status: topCommunicationFlowsStatus,
    error: topCommunicationFlowsError,
    isFetchingNextPage: isTopCommunicationFlowsFetchingNextPage,
    fetchNextPage: fetchTopCommunicationFlowsNextPage,
    hasNextPage: hasTopCommunicationFlowsNextPage,
    refetch: topCommunicationFlowsRefetching,
  } = useInfiniteQuery(
    otCommunicationControlTopFlowsInfiniteQuery({
      limit: topFlowRowsLimit,
      timeRange,
      customStart,
      customEnd,
      source: topFlowFilters.source,
      destination: topFlowFilters.destination,
      protocol: topFlowFilters.protocol,
      severity: topFlowFilters.severity,
    }),
  );

  const {
    data: smartloggerTopologyFlowResponse,
    isFetching: smartloggerTopologyFlowPending,
    isError: smartloggerTopologyFlowHasError,
    error: smartloggerTopologyFlowError,
    refetch: smartloggerTopologyFlowRefetching,
  } = useQuery(
    otCommunicationControlSmartloggerTopologyFlowQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: modbusResponseTimeResponse,
    isFetching: modbusResponseTimePending,
    isError: modbusResponseTimeHasError,
    error: modbusResponseTimeError,
    refetch: modbusResponseTimeRefetching,
  } = useQuery(
    otCommunicationControlModbusResponseTimeQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: modbusRequestsErrorsResponse,
    isFetching: modbusRequestsErrorsPending,
    isError: modbusRequestsErrorsHasError,
    error: modbusRequestsErrorsError,
    refetch: modbusRequestsErrorsRefetching,
  } = useQuery(
    otCommunicationControlModbusRequestsErrorsQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const {
    data: modbusUnitHealthResponse,
    isFetching: modbusUnitHealthPending,
    isError: modbusUnitHealthHasError,
    error: modbusUnitHealthError,
    refetch: modbusUnitHealthRefetching,
  } = useQuery(
    otCommunicationControlModbusUnitHealthQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );

  const communicationKpiCards = useMemo<DashboardKpiCard[]>(() => {
    if (communicationKpisResponse?.metrics?.length) {
      return communicationKpisResponse.metrics.map((metric) => ({
        id: metric.id,
        title: metric.title,
        value: metric.value,
        helper: metric.helper,
        trendLabel: metric.trend_label,
        tone: metric.tone,
      }));
    }

    return [
      {
        id: "active-assets",
        title: "Observed Assets (IPs)",
        value: "0",
        helper: "No KPI data in the selected range.",
        trendLabel: "Asset coverage",
        tone: "sky",
      },
      {
        id: "observed-flows",
        title: "Observed Host Flows",
        value: "0",
        helper: "No KPI data in the selected range.",
        trendLabel: "Path mapping",
        tone: "violet",
      },
      {
        id: "modbus-success-rate",
        title: "Modbus Operation Health",
        value: "0.0%",
        helper: "No KPI data in the selected range.",
        trendLabel: "Control reliability",
        tone: "amber",
      },
    ];
  }, [communicationKpisResponse?.metrics]);

  const sankeyRows = useMemo<DashboardSankeyLinkRow[]>(() => (
    (communicationFlowResponse?.rows ?? []).map((row) => ({
      source: row.source,
      target: row.target,
      weight: row.weight,
      highestSeverity: row.highest_severity,
      avgRiskScore: row.avg_risk_score,
      protocols: row.protocols,
      lastSeen: row.last_seen,
    }))
  ), [communicationFlowResponse?.rows]);

  const topCommunicationFlowRows = useMemo<DashboardFlowTableRow[]>(
    () => buildOtCommunicationTopFlowRows(topCommunicationFlowsResponse?.pages.flatMap((page) => page.rows) ?? []),
    [topCommunicationFlowsResponse?.pages],
  );

  const smartloggerTopologyRows = useMemo<DashboardSmartloggerTopologyRow[]>(
    () => buildOtCommunicationSmartloggerTopologyRows(smartloggerTopologyFlowResponse?.rows ?? []),
    [smartloggerTopologyFlowResponse?.rows],
  );

  const modbusLatencyRows = useMemo<DashboardModbusLatencyRow[]>(() => {
    const grouped = new Map<string, DashboardModbusLatencyRow>();
    const points = modbusResponseTimeResponse?.points ?? [];

    points.forEach((point) => {
      if (!grouped.has(point.bucket_start)) {
        grouped.set(point.bucket_start, {
          bucket: formatOtCommunicationBucketLabel(point.bucket_start),
          unit0AvgMs: 0,
          unit1AvgMs: 0,
          unit11AvgMs: 0,
          unit100AvgMs: 0,
        });
      }

      const row = grouped.get(point.bucket_start);
      if (!row) {
        return;
      }

      if (point.unit_id === 0) {
        row.unit0AvgMs = point.avg_response_time_ms;
      } else if (point.unit_id === 1) {
        row.unit1AvgMs = point.avg_response_time_ms;
      } else if (point.unit_id === 11) {
        row.unit11AvgMs = point.avg_response_time_ms;
      } else if (point.unit_id === 100) {
        row.unit100AvgMs = point.avg_response_time_ms;
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => +new Date(a) - +new Date(b))
      .map(([, row]) => row);
  }, [modbusResponseTimeResponse?.points]);

  const modbusRequestErrorRows = useMemo<DashboardModbusRequestsErrorRow[]>(
    () => (modbusRequestsErrorsResponse?.points ?? []).map((point) => ({
      bucket: formatOtCommunicationBucketLabel(point.bucket_start),
      totalRequests: point.total_requests,
      totalErrors: point.total_errors,
    })),
    [modbusRequestsErrorsResponse?.points],
  );

  const modbusUnitRows = useMemo<DashboardModbusUnitHealthRow[]>(
    () => (modbusUnitHealthResponse?.rows ?? []).map((row) => ({
      unitId: row.unit_id,
      totalRequests: row.total_requests,
      successCount: row.success_count,
      errorCount: row.error_count,
      slowCount: row.slow_count,
      responseTimeAvgMs: row.response_time_avg_ms,
      responseTimeMaxMs: row.response_time_max_ms,
    })),
    [modbusUnitHealthResponse?.rows],
  );

  const kpisErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(communicationKpisError, "Unable to load KPI data right now."),
    [communicationKpisError],
  );

  const sankeyErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(communicationFlowError, "Unable to load communication flow right now."),
    [communicationFlowError],
  );

  const topCommunicationFlowsErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(topCommunicationFlowsError, "Unable to load top communication flows right now."),
    [topCommunicationFlowsError],
  );

  const modbusResponseTimeErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(modbusResponseTimeError, "Unable to load Modbus response time right now."),
    [modbusResponseTimeError],
  );

  const smartloggerTopologyErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(smartloggerTopologyFlowError, "Unable to load SmartLogger topology flow right now."),
    [smartloggerTopologyFlowError],
  );

  const modbusRequestsErrorsErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(modbusRequestsErrorsError, "Unable to load Modbus request/error trend right now."),
    [modbusRequestsErrorsError],
  );

  const modbusUnitHealthErrorMessage = useMemo(
    () => extractOtCommunicationErrorMessage(modbusUnitHealthError, "Unable to load Modbus unit health right now."),
    [modbusUnitHealthError],
  );

  const refreshOTCommunicationControl = async () => {

    await Promise.all([
      communicationKpisRefetching(),
      communicationFlowRefetching(),
      topCommunicationFlowsRefetching(),
      smartloggerTopologyFlowRefetching(),
      modbusResponseTimeRefetching(),
      modbusRequestsErrorsRefetching(),
      modbusUnitHealthRefetching(),
    ]);
  };

  return {
    timeRange,
    customStart,
    customEnd,
    isRefreshing,
    setIsRefreshing,
    refreshOTCommunicationControl,
    isLoading: isRefreshing
      || communicationKpisPending
      || communicationFlowPending
      || topCommunicationFlowsStatus === "pending"
      || smartloggerTopologyFlowPending
      || modbusResponseTimePending
      || modbusRequestsErrorsPending
      || modbusUnitHealthPending,
    isKpisLoading: isRefreshing || communicationKpisPending,
    isSankeyLoading: isRefreshing || communicationFlowPending,
    isTopCommunicationFlowsLoading: isRefreshing || topCommunicationFlowsStatus === "pending",
    isSmartloggerTopologyLoading: isRefreshing || smartloggerTopologyFlowPending,
    isModbusResponseTimeLoading: isRefreshing || modbusResponseTimePending,
    isModbusRequestsErrorsLoading: isRefreshing || modbusRequestsErrorsPending,
    isModbusUnitHealthLoading: isRefreshing || modbusUnitHealthPending,
    isKpisError: communicationKpisHasError,
    isSankeyError: communicationFlowHasError,
    isTopCommunicationFlowsError: topCommunicationFlowsStatus === "error",
    isSmartloggerTopologyError: smartloggerTopologyFlowHasError,
    isModbusResponseTimeError: modbusResponseTimeHasError,
    isModbusRequestsErrorsError: modbusRequestsErrorsHasError,
    isModbusUnitHealthError: modbusUnitHealthHasError,
    hasTopCommunicationFlowsNextPage: hasTopCommunicationFlowsNextPage ?? false,
    isTopCommunicationFlowsFetchingNextPage,
    fetchTopCommunicationFlowsNextPage,
    refetchTopCommunicationFlows: topCommunicationFlowsRefetching,
    kpisErrorMessage,
    sankeyErrorMessage,
    topCommunicationFlowsErrorMessage,
    smartloggerTopologyErrorMessage,
    modbusResponseTimeErrorMessage,
    modbusRequestsErrorsErrorMessage,
    modbusUnitHealthErrorMessage,
    communicationKpiCards,
    sankeyRows,
    flowTableRows: topCommunicationFlowRows,
    smartloggerTopologyRows,
    modbusLatencyRows,
    modbusRequestErrorRows,
    modbusUnitRows,
  };
}

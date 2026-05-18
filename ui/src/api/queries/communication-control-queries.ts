import { queryOptions } from "@tanstack/react-query";
import api from "..";

const OT_COMMUNICATION_BACKGROUND_REFRESH_MS = 30_000;

const fetchOtCommunicationControlKpis = async (params: FetchOtCommunicationControlKpisParams = {}) => {
  const res = await api.get<OtCommunicationControlKpisResponse>("/ot-communication/kpis", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlFlow = async (params: FetchOtCommunicationControlFlowParams = {}) => {
  const res = await api.get<OtCommunicationControlFlowResponse>("/ot-communication/communication-flow", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlSmartloggerTopologyFlow = async (
  params: FetchOtCommunicationControlSmartloggerTopologyParams = {},
) => {
  const res = await api.get<OtCommunicationControlSmartloggerTopologyResponse>("/ot-communication/smartlogger-topology-flow", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlTopFlowsInfinite = async ({
  pageParam = 0,
  limit = 15,
  timeRange,
  customStart,
  customEnd,
  source,
  destination,
  protocol,
  severity,
}: {
  pageParam?: number;
} & FetchOtCommunicationControlTopFlowsParams): Promise<OtCommunicationControlTopFlowsResponse> => {
  const res = await api.get<OtCommunicationControlTopFlowsResponse>("/ot-communication/top-communication-flows", {
    params: {
      offset: pageParam,
      limit,
      timeRange: timeRange ?? "1h",
      customStart: customStart ?? undefined,
      customEnd: customEnd ?? undefined,
      source: source?.trim() ? source : undefined,
      destination: destination?.trim() ? destination : undefined,
      protocol: protocol ?? undefined,
      severity: severity ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlModbusResponseTime = async (
  params: FetchOtCommunicationControlModbusResponseTimeParams = {},
) => {
  const res = await api.get<OtCommunicationControlModbusResponseTimeResponse>("/ot-communication/modbus-response-time-by-unit", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlModbusRequestsErrors = async (
  params: FetchOtCommunicationControlModbusRequestsErrorsParams = {},
) => {
  const res = await api.get<OtCommunicationControlModbusRequestsErrorsResponse>("/ot-communication/modbus-requests-vs-errors", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

const fetchOtCommunicationControlModbusUnitHealth = async (
  params: FetchOtCommunicationControlModbusUnitHealthParams = {},
) => {
  const res = await api.get<OtCommunicationControlModbusUnitHealthResponse>("/ot-communication/modbus-unit-health", {
    params: {
      timeRange: params.timeRange ?? "1h",
      customStart: params.customStart ?? undefined,
      customEnd: params.customEnd ?? undefined,
    },
  });

  return res.data;
};

export const otCommunicationControlKpisQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlKpisParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-kpis", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlKpis({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlFlowQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlFlowParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-flow", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlFlow({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlSmartloggerTopologyFlowQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlSmartloggerTopologyParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-smartlogger-topology-flow", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlSmartloggerTopologyFlow({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlTopFlowsInfiniteQuery = ({
  limit = 15,
  timeRange,
  customStart,
  customEnd,
  source,
  destination,
  protocol,
  severity,
}: FetchOtCommunicationControlTopFlowsParams = {}) =>
  ({
    queryKey: [
      "ot-communication-top-flows",
      "infinite",
      limit,
      timeRange ?? "1h",
      customStart ?? undefined,
      customEnd ?? undefined,
      source ?? undefined,
      destination ?? undefined,
      protocol ?? undefined,
      severity ?? undefined,
    ],
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
      fetchOtCommunicationControlTopFlowsInfinite({
        pageParam,
        limit,
        timeRange,
        customStart,
        customEnd,
        source,
        destination,
        protocol,
        severity,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: OtCommunicationControlTopFlowsResponse) => {
      if (lastPage.has_more) {
        const currentOffset = lastPage.page > 0 ? (lastPage.page - 1) * lastPage.per_page : 0;
        return currentOffset + lastPage.per_page;
      }

      return undefined;
    },
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlModbusResponseTimeQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlModbusResponseTimeParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-modbus-response-time", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlModbusResponseTime({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlModbusRequestsErrorsQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlModbusRequestsErrorsParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-modbus-requests-errors", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlModbusRequestsErrors({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

export const otCommunicationControlModbusUnitHealthQuery = ({
  timeRange,
  customStart,
  customEnd,
}: FetchOtCommunicationControlModbusUnitHealthParams = {}) =>
  queryOptions({
    queryKey: ["ot-communication-modbus-unit-health", timeRange ?? "1h", customStart ?? undefined, customEnd ?? undefined],
    queryFn: () => fetchOtCommunicationControlModbusUnitHealth({ timeRange, customStart, customEnd }),
    placeholderData: (previousData) => previousData,
    refetchInterval: OT_COMMUNICATION_BACKGROUND_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

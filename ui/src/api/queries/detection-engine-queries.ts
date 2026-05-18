import { queryOptions } from "@tanstack/react-query";
import api from "..";

const DETECTION_ENGINE_BACKGROUND_REFRESH_MS = 30_000;

export type DetectionRuleMutationPayload = Omit<
  DetectionRuleApiRow,
  "id" | "created_by_user_id" | "version" | "created_at" | "updated_at"
>;

export type DetectionAllowlistMutationPayload = Omit<
  DetectionAllowlistApiRow,
  "id" | "created_by_user_id" | "created_at" | "updated_at"
>;

export type DetectionNotificationPolicyMutationPayload = Omit<
  DetectionNotificationPolicyApiRow,
  "id" | "created_by_user_id" | "created_at" | "updated_at"
>;

export type DetectionDeviceNameMappingMutationPayload = Omit<
  DetectionDeviceNameMappingApiRow,
  "id" | "created_by_user_id" | "created_at" | "updated_at"
>;

type DetectionDeviceNameMappingApiPayload = {
  mapping_type: "ip" | "modbus_unit";
  ip_address?: string | null;
  unit_id?: number | null;
  display_name: string;
  description: string | null;
  is_active: boolean;
};

const IP_DOT_VARIANTS_REGEX = /[。．｡]/g;
const WHITESPACE_REGEX = /\s+/g;
const INVISIBLE_IP_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;

function normalizeIpAddressInput(raw: string): string | null {
  const compactValue = raw
    .replace(IP_DOT_VARIANTS_REGEX, ".")
    .replace(INVISIBLE_IP_CHARS_REGEX, "")
    .replace(WHITESPACE_REGEX, "")
    .trim();
  return compactValue || null;
}

function normalizeDetectionDeviceMappingPayload(
  payload: DetectionDeviceNameMappingMutationPayload,
): DetectionDeviceNameMappingApiPayload {
  const mappingType = payload.mapping_type === "modbus_unit" ? "modbus_unit" : "ip";
  const normalizedDisplayName = payload.display_name.trim();
  const normalizedDescription = typeof payload.description === "string"
    ? (payload.description.trim() || null)
    : null;

  if (mappingType === "ip") {
    const normalizedIp = typeof payload.ip_address === "string"
      ? normalizeIpAddressInput(payload.ip_address)
      : null;
    return {
      mapping_type: "ip",
      ip_address: normalizedIp,
      display_name: normalizedDisplayName,
      description: normalizedDescription,
      is_active: payload.is_active,
    };
  }

  return {
    mapping_type: "modbus_unit",
    unit_id: Number.isFinite(payload.unit_id) ? payload.unit_id : null,
    display_name: normalizedDisplayName,
    description: normalizedDescription,
    is_active: payload.is_active,
  };
}

const fetchDetectionRules = async () => {
  const res = await api.get<DetectionRuleApiRow[]>("/detection-engine/rules");
  return res.data;
};

const fetchDetectionAllowlists = async () => {
  const res = await api.get<DetectionAllowlistApiRow[]>("/detection-engine/allowlists");
  return res.data;
};

const fetchDetectionNotificationPolicies = async () => {
  const res = await api.get<DetectionNotificationPolicyApiRow[]>("/detection-engine/notification-policies");
  return res.data;
};

const fetchDetectionDeviceMappings = async () => {
  const res = await api.get<DetectionDeviceNameMappingApiRow[]>("/detection-engine/device-mappings");
  return res.data;
};

const fetchDetectionIncidentsInfinite = async ({
  pageParam = 0,
  limit = 25,
  status,
}: {
  pageParam?: number;
  limit?: number;
  status?: string;
}): Promise<DetectionIncidentsResponse> => {
  const res = await api.get<DetectionIncidentsResponse>("/detection-engine/incidents", {
    params: {
      offset: pageParam,
      limit,
      status: status || undefined,
    },
  });
  return res.data;
};

const fetchDetectionIncidentEventsInfinite = async ({
  incidentId,
  pageParam = 0,
  limit = 25,
}: {
  incidentId: string;
  pageParam?: number;
  limit?: number;
}): Promise<DetectionIncidentEventsResponse> => {
  const res = await api.get<DetectionIncidentEventsResponse>(
    `/detection-engine/incidents/${encodeURIComponent(incidentId)}/events`,
    {
      params: {
        offset: pageParam,
        limit,
      },
    },
  );
  return res.data;
};

export const detectionRulesQuery = () => queryOptions({
  queryKey: ["detection-engine-rules"],
  queryFn: fetchDetectionRules,
  placeholderData: (previousData) => previousData,
  refetchInterval: DETECTION_ENGINE_BACKGROUND_REFRESH_MS,
  refetchIntervalInBackground: true,
});

export const detectionAllowlistsQuery = () => queryOptions({
  queryKey: ["detection-engine-allowlists"],
  queryFn: fetchDetectionAllowlists,
  placeholderData: (previousData) => previousData,
  refetchInterval: DETECTION_ENGINE_BACKGROUND_REFRESH_MS,
  refetchIntervalInBackground: true,
});

export const detectionIncidentsInfiniteQuery = ({
  limit = 25,
  status,
}: {
  limit?: number;
  status?: string;
} = {}) => ({
  queryKey: ["detection-engine-incidents", "infinite", limit, status || "all"],
  queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
    fetchDetectionIncidentsInfinite({
      pageParam,
      limit,
      status,
    }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: DetectionIncidentsResponse) => {
    if (!lastPage.has_more) {
      return undefined;
    }

    const currentOffset = lastPage.page > 0 ? (lastPage.page - 1) * lastPage.per_page : 0;
    return currentOffset + lastPage.per_page;
  },
  staleTime: 30_000,
  gcTime: 5 * 60 * 1000,
});

export const detectionIncidentEventsInfiniteQuery = ({
  incidentId,
  limit = 25,
}: {
  incidentId: string;
  limit?: number;
}) => ({
  queryKey: ["detection-engine-incident-events", "infinite", incidentId, limit],
  queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
    fetchDetectionIncidentEventsInfinite({
      incidentId,
      pageParam,
      limit,
    }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: DetectionIncidentEventsResponse) => {
    if (!lastPage.has_more) {
      return undefined;
    }

    const currentOffset = lastPage.page > 0 ? (lastPage.page - 1) * lastPage.per_page : 0;
    return currentOffset + lastPage.per_page;
  },
  staleTime: 30_000,
  gcTime: 5 * 60 * 1000,
});

export const detectionNotificationPoliciesQuery = () => queryOptions({
  queryKey: ["detection-engine-notification-policies"],
  queryFn: fetchDetectionNotificationPolicies,
  placeholderData: (previousData) => previousData,
  refetchInterval: DETECTION_ENGINE_BACKGROUND_REFRESH_MS,
  refetchIntervalInBackground: true,
});

export const detectionDeviceMappingsQuery = () => queryOptions({
  queryKey: ["detection-engine-device-mappings"],
  queryFn: fetchDetectionDeviceMappings,
  placeholderData: (previousData) => previousData,
  refetchInterval: DETECTION_ENGINE_BACKGROUND_REFRESH_MS,
  refetchIntervalInBackground: true,
});

export const createDetectionRule = async (payload: DetectionRuleMutationPayload) => {
  const res = await api.post<DetectionRuleApiRow>("/detection-engine/rules", payload);
  return res.data;
};

export const updateDetectionRule = async (ruleId: number, payload: Partial<DetectionRuleMutationPayload>) => {
  const res = await api.put<DetectionRuleApiRow>(`/detection-engine/rules/${ruleId}`, payload);
  return res.data;
};

export const deleteDetectionRule = async (ruleId: number) => {
  await api.delete(`/detection-engine/rules/${ruleId}`);
  return null;
};

export const testDetectionRule = async (payload: DetectionRuleTestRequest) => {
  const res = await api.post<DetectionRuleTestResponse>("/detection-engine/rules/test", payload);
  return res.data;
};

export const createDetectionAllowlist = async (payload: DetectionAllowlistMutationPayload) => {
  const res = await api.post<DetectionAllowlistApiRow>("/detection-engine/allowlists", payload);
  return res.data;
};

export const updateDetectionAllowlist = async (
  scopeId: number,
  payload: Partial<DetectionAllowlistMutationPayload>,
) => {
  const res = await api.put<DetectionAllowlistApiRow>(`/detection-engine/allowlists/${scopeId}`, payload);
  return res.data;
};

export const deleteDetectionAllowlist = async (scopeId: number) => {
  await api.delete(`/detection-engine/allowlists/${scopeId}`);
  return null;
};

export const createDetectionNotificationPolicy = async (
  payload: DetectionNotificationPolicyMutationPayload,
) => {
  const res = await api.post<DetectionNotificationPolicyApiRow>("/detection-engine/notification-policies", payload);
  return res.data;
};

export const updateDetectionNotificationPolicy = async (
  policyId: number,
  payload: Partial<DetectionNotificationPolicyMutationPayload>,
) => {
  const res = await api.put<DetectionNotificationPolicyApiRow>(
    `/detection-engine/notification-policies/${policyId}`,
    payload,
  );
  return res.data;
};

export const deleteDetectionNotificationPolicy = async (policyId: number) => {
  await api.delete(`/detection-engine/notification-policies/${policyId}`);
  return null;
};

export const createDetectionDeviceMapping = async (
  payload: DetectionDeviceNameMappingMutationPayload,
) => {
  const normalizedPayload = normalizeDetectionDeviceMappingPayload(payload);
  const res = await api.post<DetectionDeviceNameMappingApiRow>("/detection-engine/device-mappings", normalizedPayload);
  return res.data;
};

export const updateDetectionDeviceMapping = async (
  mappingId: number,
  payload: DetectionDeviceNameMappingMutationPayload,
) => {
  const normalizedPayload = normalizeDetectionDeviceMappingPayload(payload);
  const res = await api.put<DetectionDeviceNameMappingApiRow>(
    `/detection-engine/device-mappings/${mappingId}`,
    normalizedPayload,
  );
  return res.data;
};

export const deleteDetectionDeviceMapping = async (mappingId: number) => {
  await api.delete(`/detection-engine/device-mappings/${mappingId}`);
  return null;
};

export const acknowledgeDetectionIncident = async (incidentKey: string, note?: string) => {
  const res = await api.post<DetectionIncidentStatusActionResponse>(
    `/detection-engine/incidents/${encodeURIComponent(incidentKey)}/ack`,
    null,
    { params: { note: note || undefined } },
  );
  return res.data;
};

export const closeDetectionIncident = async (incidentKey: string, note?: string) => {
  const res = await api.post<DetectionIncidentStatusActionResponse>(
    `/detection-engine/incidents/${encodeURIComponent(incidentKey)}/close`,
    null,
    { params: { note: note || undefined } },
  );
  return res.data;
};

export const reopenDetectionIncident = async (incidentKey: string, note?: string) => {
  const res = await api.post<DetectionIncidentStatusActionResponse>(
    `/detection-engine/incidents/${encodeURIComponent(incidentKey)}/reopen`,
    null,
    { params: { note: note || undefined } },
  );
  return res.data;
};

export const runDetectionWorkersOnce = async () => {
  const res = await api.post<DetectionWorkerRunOnceResponse>("/detection-engine/workers/run-once");
  return res.data;
};

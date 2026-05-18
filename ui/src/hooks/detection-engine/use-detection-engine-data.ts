import queryClient from "@/api/queries";
import {
  acknowledgeDetectionIncident,
  closeDetectionIncident,
  createDetectionAllowlist,
  createDetectionDeviceMapping,
  createDetectionNotificationPolicy,
  createDetectionRule,
  deleteDetectionAllowlist,
  deleteDetectionDeviceMapping,
  deleteDetectionNotificationPolicy,
  deleteDetectionRule,
  detectionAllowlistsQuery,
  detectionDeviceMappingsQuery,
  detectionIncidentsInfiniteQuery,
  detectionNotificationPoliciesQuery,
  detectionRulesQuery,
  reopenDetectionIncident,
  runDetectionWorkersOnce,
  testDetectionRule,
  updateDetectionAllowlist,
  updateDetectionDeviceMapping,
  updateDetectionNotificationPolicy,
  updateDetectionRule,
  type DetectionAllowlistMutationPayload,
  type DetectionDeviceNameMappingMutationPayload,
  type DetectionNotificationPolicyMutationPayload,
  type DetectionRuleMutationPayload,
} from "@/api/queries/detection-engine-queries";
import { getApiErrorMessage } from "@/lib/utils";
import useDeviceMappingsStore from "@/stores/device-mappings-store";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function useDetectionEngineData() {
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<string>("all");
  const setDeviceMappings = useDeviceMappingsStore((state) => state.setMappings);

  const rulesQuery = useQuery(detectionRulesQuery());
  const allowlistsQuery = useQuery(detectionAllowlistsQuery());
  const deviceMappingsQuery = useQuery(detectionDeviceMappingsQuery());
  const notificationPoliciesQuery = useQuery(detectionNotificationPoliciesQuery());
  const incidentsQuery = useInfiniteQuery(
    detectionIncidentsInfiniteQuery({
      limit: 25,
      status: incidentStatusFilter === "all" ? undefined : incidentStatusFilter,
    }),
  );

  const incidents = useMemo(
    () => incidentsQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [incidentsQuery.data?.pages],
  );

  const syncDeviceMappingsStore = async () => {
    const latestMappings = await queryClient.fetchQuery(detectionDeviceMappingsQuery());
    setDeviceMappings(latestMappings);
  };

  const createRuleMutation = useMutation({
    mutationFn: (payload: DetectionRuleMutationPayload) => createDetectionRule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-rules"] });
      toast.success("Rule created", { description: "Detection rule has been saved." });
    },
    onError: (error) => {
      toast.error("Failed to create rule", {
        description: getApiErrorMessage(error, "Unable to create detection rule."),
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: number; payload: Partial<DetectionRuleMutationPayload> }) =>
      updateDetectionRule(ruleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-rules"] });
      toast.success("Rule updated", { description: "Detection rule has been updated." });
    },
    onError: (error) => {
      toast.error("Failed to update rule", {
        description: getApiErrorMessage(error, "Unable to update detection rule."),
      });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: number) => deleteDetectionRule(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-rules"] });
      toast.success("Rule deleted", { description: "Detection rule has been deleted." });
    },
    onError: (error) => {
      toast.error("Failed to delete rule", {
        description: getApiErrorMessage(error, "Unable to delete detection rule."),
      });
    },
  });

  const createAllowlistMutation = useMutation({
    mutationFn: (payload: DetectionAllowlistMutationPayload) => createDetectionAllowlist(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-allowlists"] });
      toast.success("Allowlist created", { description: "Allowlist scope has been saved." });
    },
    onError: (error) => {
      toast.error("Failed to create allowlist", {
        description: getApiErrorMessage(error, "Unable to create allowlist scope."),
      });
    },
  });

  const updateAllowlistMutation = useMutation({
    mutationFn: ({ scopeId, payload }: { scopeId: number; payload: Partial<DetectionAllowlistMutationPayload> }) =>
      updateDetectionAllowlist(scopeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-allowlists"] });
      toast.success("Allowlist updated", { description: "Allowlist scope has been updated." });
    },
    onError: (error) => {
      toast.error("Failed to update allowlist", {
        description: getApiErrorMessage(error, "Unable to update allowlist scope."),
      });
    },
  });

  const deleteAllowlistMutation = useMutation({
    mutationFn: (scopeId: number) => deleteDetectionAllowlist(scopeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-allowlists"] });
      toast.success("Allowlist deleted", { description: "Allowlist scope has been deleted." });
    },
    onError: (error) => {
      toast.error("Failed to delete allowlist", {
        description: getApiErrorMessage(error, "Unable to delete allowlist scope."),
      });
    },
  });

  const createNotificationPolicyMutation = useMutation({
    mutationFn: (payload: DetectionNotificationPolicyMutationPayload) => createDetectionNotificationPolicy(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-notification-policies"] });
      toast.success("Notification policy created", { description: "Notification policy has been saved." });
    },
    onError: (error) => {
      toast.error("Failed to create notification policy", {
        description: getApiErrorMessage(error, "Unable to create notification policy."),
      });
    },
  });

  const createDeviceMappingMutation = useMutation({
    mutationFn: (payload: DetectionDeviceNameMappingMutationPayload) => createDetectionDeviceMapping(payload),
    onSuccess: async () => {
      await syncDeviceMappingsStore();
      toast.success("Device mapping created", { description: "Device name mapping has been saved." });
    },
    onError: (error) => {
      toast.error("Failed to create device mapping", {
        description: getApiErrorMessage(error, "Unable to create device name mapping."),
      });
    },
  });

  const updateDeviceMappingMutation = useMutation({
    mutationFn: ({ mappingId, payload }: { mappingId: number; payload: DetectionDeviceNameMappingMutationPayload }) =>
      updateDetectionDeviceMapping(mappingId, payload),
    onSuccess: async () => {
      await syncDeviceMappingsStore();
      toast.success("Device mapping updated", { description: "Device name mapping has been updated." });
    },
    onError: (error) => {
      toast.error("Failed to update device mapping", {
        description: getApiErrorMessage(error, "Unable to update device name mapping."),
      });
    },
  });

  const deleteDeviceMappingMutation = useMutation({
    mutationFn: (mappingId: number) => deleteDetectionDeviceMapping(mappingId),
    onSuccess: async () => {
      await syncDeviceMappingsStore();
      toast.success("Device mapping deleted", { description: "Device name mapping has been deleted." });
    },
    onError: (error) => {
      toast.error("Failed to delete device mapping", {
        description: getApiErrorMessage(error, "Unable to delete device name mapping."),
      });
    },
  });

  const updateNotificationPolicyMutation = useMutation({
    mutationFn: ({ policyId, payload }: { policyId: number; payload: Partial<DetectionNotificationPolicyMutationPayload> }) =>
      updateDetectionNotificationPolicy(policyId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-notification-policies"] });
      toast.success("Notification policy updated", { description: "Notification policy has been updated." });
    },
    onError: (error) => {
      toast.error("Failed to update notification policy", {
        description: getApiErrorMessage(error, "Unable to update notification policy."),
      });
    },
  });

  const deleteNotificationPolicyMutation = useMutation({
    mutationFn: (policyId: number) => deleteDetectionNotificationPolicy(policyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-notification-policies"] });
      toast.success("Notification policy deleted", { description: "Notification policy has been deleted." });
    },
    onError: (error) => {
      toast.error("Failed to delete notification policy", {
        description: getApiErrorMessage(error, "Unable to delete notification policy."),
      });
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: (payload: DetectionRuleTestRequest) => testDetectionRule(payload),
    onError: (error) => {
      toast.error("Rule test failed", {
        description: getApiErrorMessage(error, "Unable to test this detection rule."),
      });
    },
  });

  const runWorkersOnceMutation = useMutation({
    mutationFn: runDetectionWorkersOnce,
    onSuccess: (data) => {
      toast.success("Workers executed", {
        description: `Detection events: ${data.detection.events}, Incident matches: ${data.incident.matches}`,
      });
      void queryClient.invalidateQueries({ queryKey: ["detection-engine-incidents"] });
      void queryClient.invalidateQueries({ queryKey: ["detection-engine-incident-events"] });
    },
    onError: (error) => {
      toast.error("Workers run failed", {
        description: getApiErrorMessage(error, "Unable to run workers once."),
      });
    },
  });

  const ackIncidentMutation = useMutation({
    mutationFn: (incidentKey: string) => acknowledgeDetectionIncident(incidentKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incident-events"] });
      toast.success("Success", {
        description: "Incident acknowledged successfully."
      });
    },
    onError: (error) => {
      toast.error("Failed to acknowledge incident", {
        description: getApiErrorMessage(error, "Unable to acknowledge incident."),
      });
    },
  });

  const closeIncidentMutation = useMutation({
    mutationFn: (incidentKey: string) => closeDetectionIncident(incidentKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incident-events"] });
      toast.success("Success", {
        description: "Incident closed successfully."
      });
    },
    onError: (error) => {
      toast.error("Failed to close incident", {
        description: getApiErrorMessage(error, "Unable to close incident."),
      });
    },
  });

  const reopenIncidentMutation = useMutation({
    mutationFn: (incidentKey: string) => reopenDetectionIncident(incidentKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incidents"] });
      await queryClient.invalidateQueries({ queryKey: ["detection-engine-incident-events"] });
      toast.success("Success", {
        description: "Incident reopened successfully."
      });
    },
    onError: (error) => {
      toast.error("Failed to reopen incident", {
        description: getApiErrorMessage(error, "Unable to reopen incident."),
      });
    },
  });

  const refreshAll = async () => {
    await Promise.all([
      rulesQuery.refetch(),
      allowlistsQuery.refetch(),
      deviceMappingsQuery.refetch(),
      notificationPoliciesQuery.refetch(),
      incidentsQuery.refetch(),
    ]);
  };

  return {
    incidentStatusFilter,
    setIncidentStatusFilter,
    rules: rulesQuery.data ?? [],
    allowlists: allowlistsQuery.data ?? [],
    deviceMappings: deviceMappingsQuery.data ?? [],
    notificationPolicies: notificationPoliciesQuery.data ?? [],
    incidents,
    rulesQuery,
    allowlistsQuery,
    deviceMappingsQuery,
    notificationPoliciesQuery,
    incidentsQuery,
    hasIncidentsNextPage: incidentsQuery.hasNextPage ?? false,
    isIncidentsFetchingNextPage: incidentsQuery.isFetchingNextPage,
    createRuleMutation,
    updateRuleMutation,
    deleteRuleMutation,
    createAllowlistMutation,
    updateAllowlistMutation,
    deleteAllowlistMutation,
    createDeviceMappingMutation,
    updateDeviceMappingMutation,
    deleteDeviceMappingMutation,
    createNotificationPolicyMutation,
    updateNotificationPolicyMutation,
    deleteNotificationPolicyMutation,
    testRuleMutation,
    runWorkersOnceMutation,
    ackIncidentMutation,
    closeIncidentMutation,
    reopenIncidentMutation,
    refreshAll,
  };
}

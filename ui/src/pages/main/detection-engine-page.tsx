import RefreshBtn from "@/components/btn/refresh-btn";
import AllowListsTab from "@/components/detection-engine/allow-lists-tab";
import DetectionRulesTab from "@/components/detection-engine/detection-rules-tab";
import DeviceMappingsTab from "@/components/detection-engine/device-mappings-tab";
import IncidentsTab from "@/components/detection-engine/incidents-tab";
import NotificationTab from "@/components/detection-engine/notification-tab";
import type { DetectionSubTab } from "@/components/detection-engine/types";
import PageHeader from "@/components/shared/page-header";
import Spinner from "@/components/shared/spinner";
import SubTabs from "@/components/shared/sub-tabs";
import { Button } from "@/components/ui/button";
import useDetectionEngineData from "@/hooks/detection-engine/use-detection-engine-data";
import useTitle from "@/hooks/system/use-title";
import { useMemo, useState } from "react";
import { AiOutlineFileText } from "react-icons/ai";
import { FiAlertOctagon, FiPlay, FiTag } from "react-icons/fi";
import { PiBellSimpleRinging, PiShieldCheck } from "react-icons/pi";
import { toast } from "sonner";
import useUserStore from "@/stores/user-store";

export default function DetectionEnginePage() {
  useTitle("Detection Engine");
  const { user } = useUserStore();
  const isViewer = user?.role === "viewer";

  const {
    incidentStatusFilter,
    setIncidentStatusFilter,
    rules,
    allowlists,
    deviceMappings,
    notificationPolicies,
    incidents,
    rulesQuery,
    allowlistsQuery,
    deviceMappingsQuery,
    notificationPoliciesQuery,
    incidentsQuery,
    hasIncidentsNextPage,
    isIncidentsFetchingNextPage,
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
  } = useDetectionEngineData();

  const [activeTab, setActiveTab] = useState<DetectionSubTab>("allowlists");
  const [isAllowlistsRefreshing, setIsAllowlistsRefreshing] = useState(false);
  const [isDeviceMappingsRefreshing, setIsDeviceMappingsRefreshing] = useState(false);
  const [isRulesRefreshing, setIsRulesRefreshing] = useState(false);
  const [isIncidentsRefreshing, setIsIncidentsRefreshing] = useState(false);
  const [isNotificationsRefreshing, setIsNotificationsRefreshing] = useState(false);
  const isAnyTabRefreshing = isAllowlistsRefreshing
    || isDeviceMappingsRefreshing
    || isRulesRefreshing
    || isIncidentsRefreshing
    || isNotificationsRefreshing;

  const isBusy = useMemo(
    () => createRuleMutation.isPending
      || updateRuleMutation.isPending
      || deleteRuleMutation.isPending
      || createAllowlistMutation.isPending
      || updateAllowlistMutation.isPending
      || deleteAllowlistMutation.isPending
      || createDeviceMappingMutation.isPending
      || updateDeviceMappingMutation.isPending
      || deleteDeviceMappingMutation.isPending
      || createNotificationPolicyMutation.isPending
      || updateNotificationPolicyMutation.isPending
      || deleteNotificationPolicyMutation.isPending
      || testRuleMutation.isPending
      || runWorkersOnceMutation.isPending
      || ackIncidentMutation.isPending
      || closeIncidentMutation.isPending
      || reopenIncidentMutation.isPending,
    [
      createRuleMutation.isPending,
      updateRuleMutation.isPending,
      deleteRuleMutation.isPending,
      createAllowlistMutation.isPending,
      updateAllowlistMutation.isPending,
      deleteAllowlistMutation.isPending,
      createDeviceMappingMutation.isPending,
      updateDeviceMappingMutation.isPending,
      deleteDeviceMappingMutation.isPending,
      createNotificationPolicyMutation.isPending,
      updateNotificationPolicyMutation.isPending,
      deleteNotificationPolicyMutation.isPending,
      testRuleMutation.isPending,
      runWorkersOnceMutation.isPending,
      ackIncidentMutation.isPending,
      closeIncidentMutation.isPending,
      reopenIncidentMutation.isPending,
    ],
  );

  const detectionTabs: Tab[] = [
    {
      id: "allowlists",
      label: "Allow Lists",
      icon: PiShieldCheck,
      description: "Scoped trust boundaries",
    },
    {
      id: "device-mappings",
      label: "Device Mappings",
      icon: FiTag,
      description: "IP and unit friendly names",
    },
    {
      id: "rules",
      label: "Detection Rules",
      icon: AiOutlineFileText,
      description: "Deterministic detection logic",
    },
    {
      id: "incidents",
      label: "Incidents",
      icon: FiAlertOctagon,
      description: "Response and triage workflow",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: PiBellSimpleRinging,
      description: "Policy-based summary dispatch",
    },
  ];

  const activeTabRefresh = useMemo(() => {
    if (activeTab === "allowlists") {
      return {
        isRefreshing: isAllowlistsRefreshing,
        setIsRefreshing: setIsAllowlistsRefreshing,
        onAction: async () => {
          await allowlistsQuery.refetch();
        },
      };
    }

    if (activeTab === "rules") {
      return {
        isRefreshing: isRulesRefreshing,
        setIsRefreshing: setIsRulesRefreshing,
        onAction: async () => {
          await rulesQuery.refetch();
        },
      };
    }

    if (activeTab === "device-mappings") {
      return {
        isRefreshing: isDeviceMappingsRefreshing,
        setIsRefreshing: setIsDeviceMappingsRefreshing,
        onAction: async () => {
          await deviceMappingsQuery.refetch();
        },
      };
    }

    if (activeTab === "notifications") {
      return {
        isRefreshing: isNotificationsRefreshing,
        setIsRefreshing: setIsNotificationsRefreshing,
        onAction: async () => {
          await notificationPoliciesQuery.refetch();
        },
      };
    }

    return {
      isRefreshing: isIncidentsRefreshing,
      setIsRefreshing: setIsIncidentsRefreshing,
      onAction: async () => {
        await incidentsQuery.refetch();
      },
    };
  }, [
    activeTab,
    allowlistsQuery,
    deviceMappingsQuery,
    notificationPoliciesQuery,
    rulesQuery,
    incidentsQuery,
    isAllowlistsRefreshing,
    isDeviceMappingsRefreshing,
    isRulesRefreshing,
    isIncidentsRefreshing,
    isNotificationsRefreshing,
  ]);

  const notifyViewerActionDenied = () => {
    toast.error("Action Denied", {
      description: "You are not allowed to modify detection engine resources with the viewer role.",
    });
  };

  return (
    <section className="space-y-4">

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center justify-between">
        <PageHeader
          title="Detection Engine"
          subTitle="Enterprise-grade detection operations with consistent creation flows and focused triage workflows."
          size="lg"
        />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RefreshBtn
            isDisabled={isBusy || isAnyTabRefreshing}
            isRefreshing={activeTabRefresh.isRefreshing}
            setIsRefreshing={activeTabRefresh.setIsRefreshing}
            onAction={activeTabRefresh.onAction}
            height="h-9"
          />

          <Button
            className="cursor-pointer bg-gradient text-white transition-all duration-300 hover:brightness-110"
            disabled={runWorkersOnceMutation.isPending || isAnyTabRefreshing}
            onClick={() => {
              if (isViewer) {
                notifyViewerActionDenied();
                return;
              }
              runWorkersOnceMutation.mutate();
            }}
          >
            <Spinner isLoading={runWorkersOnceMutation.isPending} label="Running...">
              <FiPlay className="size-4" />
              Run Workers Once
            </Spinner>
          </Button>
        </div>
      </div>



      <SubTabs
        tabs={detectionTabs}
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as DetectionSubTab)}
        disabled={isBusy || isAnyTabRefreshing}
      />

      {activeTab === "allowlists" && (
        <AllowListsTab
          allowlists={allowlists}
          allowlistsQuery={allowlistsQuery}
          createAllowlistMutation={createAllowlistMutation}
          updateAllowlistMutation={updateAllowlistMutation}
          deleteAllowlistMutation={deleteAllowlistMutation}
          isBusy={isBusy}
          isRefreshing={isAllowlistsRefreshing}
          isViewer={isViewer}
          onViewerActionDenied={notifyViewerActionDenied}
        />
      )}

      {activeTab === "rules" && (
        <DetectionRulesTab
          rules={rules}
          rulesQuery={rulesQuery}
          createRuleMutation={createRuleMutation}
          updateRuleMutation={updateRuleMutation}
          deleteRuleMutation={deleteRuleMutation}
          testRuleMutation={testRuleMutation}
          isBusy={isBusy}
          isRefreshing={isRulesRefreshing}
          isViewer={isViewer}
          onViewerActionDenied={notifyViewerActionDenied}
        />
      )}

      {activeTab === "device-mappings" && (
        <DeviceMappingsTab
          deviceMappings={deviceMappings}
          deviceMappingsQuery={deviceMappingsQuery}
          createDeviceMappingMutation={createDeviceMappingMutation}
          updateDeviceMappingMutation={updateDeviceMappingMutation}
          deleteDeviceMappingMutation={deleteDeviceMappingMutation}
          isBusy={isBusy}
          isRefreshing={isDeviceMappingsRefreshing}
          isViewer={isViewer}
          onViewerActionDenied={notifyViewerActionDenied}
        />
      )}

      {activeTab === "incidents" && (
        <IncidentsTab
          incidents={incidents}
          incidentsQuery={incidentsQuery}
          incidentStatusFilter={incidentStatusFilter}
          setIncidentStatusFilter={setIncidentStatusFilter}
          hasIncidentsNextPage={hasIncidentsNextPage}
          isIncidentsFetchingNextPage={isIncidentsFetchingNextPage}
          ackIncidentMutation={ackIncidentMutation}
          closeIncidentMutation={closeIncidentMutation}
          reopenIncidentMutation={reopenIncidentMutation}
          isRefreshing={isIncidentsRefreshing}
          isViewer={isViewer}
          onViewerActionDenied={notifyViewerActionDenied}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationTab
          notificationPolicies={notificationPolicies}
          notificationPoliciesQuery={notificationPoliciesQuery}
          createNotificationPolicyMutation={createNotificationPolicyMutation}
          updateNotificationPolicyMutation={updateNotificationPolicyMutation}
          deleteNotificationPolicyMutation={deleteNotificationPolicyMutation}
          isBusy={isBusy}
          isRefreshing={isNotificationsRefreshing}
          isViewer={isViewer}
          onViewerActionDenied={notifyViewerActionDenied}
        />
      )}
    </section>
  );
}

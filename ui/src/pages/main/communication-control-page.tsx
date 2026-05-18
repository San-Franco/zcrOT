import CustomTimeRangeBtn from "@/components/btn/custom-time-range-btn";
import RefreshBtn from "@/components/btn/refresh-btn";
import DashboardKpiCards from "@/components/communication-control/communication-kpi-cards";
import DashboardModbusRequestsErrorsCard from "@/components/communication-control/modbus-requests-errors-card";
import DashboardModbusResponseTimeCard from "@/components/communication-control/modbus-response-time-card";
import DashboardSmartloggerTopologySankeyCard from "@/components/communication-control/smartlogger-topology-sankey-card";
import DashboardModbusUnitHealthTable from "@/components/communication-control/modbus-unit-health-table";
import DashboardSankeyCommunicationCard from "@/components/communication-control/communication-path-card";
import DashboardTopCommunicationFlowsTable from "@/components/communication-control/top-communication-flows-table";
import { DASHBOARD_TIME_RANGES } from "@/lib/utils";
import CommonFilter from "@/components/shared/common-filter";
import CustomTimeRangeDisplay from "@/components/shared/custom-time-range-display";
import PageHeader from "@/components/shared/page-header";
import TimeRangeFilter from "@/components/shared/time-range-filter";
import { Skeleton } from "@/components/ui/skeleton";
import useOTCommunicationControlData from "@/hooks/ot-communication-control/use-ot-communication-control-data";
import useTitle from "@/hooks/system/use-title";

export default function CommunicationControlPage() {
  useTitle("Communication & Control");

  const {
    customStart,
    customEnd,
    isRefreshing,
    setIsRefreshing,
    refreshOTCommunicationControl,
    isLoading,
    isKpisLoading,
    isSankeyLoading,
    isKpisError,
    isSankeyError,
    kpisErrorMessage,
    sankeyErrorMessage,
    isTopCommunicationFlowsLoading,
    isModbusResponseTimeLoading,
    isModbusRequestsErrorsLoading,
    isModbusUnitHealthLoading,
    hasTopCommunicationFlowsNextPage,
    isTopCommunicationFlowsFetchingNextPage,
    fetchTopCommunicationFlowsNextPage,
    refetchTopCommunicationFlows,
    isTopCommunicationFlowsError,
    topCommunicationFlowsErrorMessage,
    isSmartloggerTopologyLoading,
    isSmartloggerTopologyError,
    smartloggerTopologyErrorMessage,
    isModbusResponseTimeError,
    modbusResponseTimeErrorMessage,
    isModbusRequestsErrorsError,
    modbusRequestsErrorsErrorMessage,
    isModbusUnitHealthError,
    modbusUnitHealthErrorMessage,
    communicationKpiCards,
    sankeyRows,
    flowTableRows,
    smartloggerTopologyRows,
    modbusLatencyRows,
    modbusRequestErrorRows,
    modbusUnitRows,
  } = useOTCommunicationControlData();
  const observedAssetsCard = communicationKpiCards.find((card) => card.id === "active-assets");

  return (
    <section className="space-y-4">
      <PageHeader
        title="Communication & Control"
        subTitle="OT asset visibility, communication paths, and Modbus control reliability."
        size="lg"
      />

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="lg:hidden">
          <CommonFilter
            isDisabled={isLoading}
            filterValue="timeRange"
            filters={DASHBOARD_TIME_RANGES}
            addFirst={false}
            defaultShow="1h"
            otherClasses="min-h-[40px] w-full sm:min-w-[130px]"
          />
        </div>
        <div className="hidden lg:block">
          <TimeRangeFilter isDisabled={isLoading} />
        </div>
        <CustomTimeRangeDisplay customStart={customStart} customEnd={customEnd} isDisabled={isLoading} />
        <CustomTimeRangeBtn isDisabled={isLoading} />
        <RefreshBtn
          isDisabled={isLoading}
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
          onAction={refreshOTCommunicationControl}
          height="h-9"
        />
      </div>

      <DashboardKpiCards
        cards={communicationKpiCards}
        isLoading={isKpisLoading}
        isError={isKpisError}
        errorMessage={kpisErrorMessage}
      />

      {isSankeyLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardSankeyCommunicationCard
          data={sankeyRows}
          observedAssetsTotal={observedAssetsCard?.value ?? null}
          isError={isSankeyError}
          errorMessage={sankeyErrorMessage}
        />
      )}

      <DashboardTopCommunicationFlowsTable
        rows={flowTableRows}
        isLoading={isTopCommunicationFlowsLoading}
        isError={isTopCommunicationFlowsError}
        errorMessage={topCommunicationFlowsErrorMessage}
        hasNextPage={hasTopCommunicationFlowsNextPage}
        isFetchingNextPage={isTopCommunicationFlowsFetchingNextPage}
        onLoadMore={() => void fetchTopCommunicationFlowsNextPage()}
        onRetry={() => void refetchTopCommunicationFlows()}
      />

      {isSmartloggerTopologyLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardSmartloggerTopologySankeyCard
          rows={smartloggerTopologyRows}
          isError={isSmartloggerTopologyError}
          errorMessage={smartloggerTopologyErrorMessage}
        />
      )}

      {isModbusResponseTimeLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardModbusResponseTimeCard
          data={modbusLatencyRows}
          isError={isModbusResponseTimeError}
          errorMessage={modbusResponseTimeErrorMessage}
        />
      )}
      {isModbusRequestsErrorsLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardModbusRequestsErrorsCard
          data={modbusRequestErrorRows}
          isError={isModbusRequestsErrorsError}
          errorMessage={modbusRequestsErrorsErrorMessage}
        />
      )}

      {isModbusUnitHealthLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardModbusUnitHealthTable
          rows={modbusUnitRows}
          isError={isModbusUnitHealthError}
          errorMessage={modbusUnitHealthErrorMessage}
        />
      )}
    </section>
  );
}

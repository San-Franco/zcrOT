import CustomTimeRangeBtn from "@/components/btn/custom-time-range-btn";
import RefreshBtn from "@/components/btn/refresh-btn";
import DashboardEventsOverTimeCard from "@/components/security-exposure/events-over-time-card";
import SecurityKpiCards from "@/components/security-exposure/security-kpi-cards";
import DashboardLiveSecurityEventsTable from "@/components/security-exposure/live-security-events-table";
import DashboardTopRiskySourcesCard from "@/components/security-exposure/top-risky-sources-card";
import DashboardVerdictTrendCard from "@/components/security-exposure/verdict-distribution-card";
import { DASHBOARD_TIME_RANGES } from "@/lib/utils";
import CommonFilter from "@/components/shared/common-filter";
import CustomTimeRangeDisplay from "@/components/shared/custom-time-range-display";
import PageHeader from "@/components/shared/page-header";
import TimeRangeFilter from "@/components/shared/time-range-filter";
import { Skeleton } from "@/components/ui/skeleton";
import useOTSecurityExposureData from "@/hooks/ot-security-exposure/use-ot-security-exposure-data";
import useTitle from "@/hooks/system/use-title";

export default function SecurityExposurePage() {
  useTitle("Security Exposure");

  const {
    customStart,
    customEnd,
    isRefreshing,
    setIsRefreshing,
    refreshOTSecurityExposure,
    isLoading,
    isKpisLoading,
    isKpisError,
    kpisErrorMessage,
    isEventsOverTimeLoading,
    isVerdictDistributionLoading,
    isEventsOverTimeError,
    isVerdictDistributionError,
    isTopRiskySourcesLoading,
    isTopRiskySourcesError,
    isLiveEventsLoading,
    isLiveEventsError,
    hasLiveEventsNextPage,
    isLiveEventsFetchingNextPage,
    fetchLiveEventsNextPage,
    refetchLiveEvents,
    eventsOverTimeErrorMessage,
    verdictDistributionErrorMessage,
    topRiskySourcesErrorMessage,
    liveEventsErrorMessage,
    networkEvents,
    securityKpiCards,
    severityTrendRows,
    verdictTrendRows,
    topRiskRows,
  } = useOTSecurityExposureData();

  return (
    <section className="space-y-4">
      <PageHeader
        title="Security Exposure"
        subTitle="Risk signals, verdict posture, and event-level investigation evidence from observed OT traffic."
        size="lg"
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="lg:hidden">
          <CommonFilter
            isDisabled={isLoading}
            filterValue="timeRange"
            filters={DASHBOARD_TIME_RANGES}
            addFirst={false}
            defaultShow="1h"
            otherClasses="min-h-[40px] min-w-[130px]"
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
          onAction={refreshOTSecurityExposure}
          height="h-9"
        />
      </div>

      <SecurityKpiCards
        cards={securityKpiCards}
        isLoading={isKpisLoading}
        isError={isKpisError}
        errorMessage={kpisErrorMessage}
      />

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          {isEventsOverTimeLoading ? (
            <Skeleton className="h-125 w-full" />
          ) : (
            <DashboardEventsOverTimeCard
              data={severityTrendRows}
              isError={isEventsOverTimeError}
              errorMessage={eventsOverTimeErrorMessage}
            />
          )}
        </div>
        {isVerdictDistributionLoading ? (
          <Skeleton className="h-125 w-full" />
        ) : (
          <DashboardVerdictTrendCard
            data={verdictTrendRows}
            isError={isVerdictDistributionError}
            errorMessage={verdictDistributionErrorMessage}
          />
        )}
      </div>

      {isTopRiskySourcesLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <DashboardTopRiskySourcesCard
          data={topRiskRows}
          isError={isTopRiskySourcesError}
          errorMessage={topRiskySourcesErrorMessage}
        />
      )}

      <DashboardLiveSecurityEventsTable
        events={networkEvents}
        isLoading={isLiveEventsLoading}
        isError={isLiveEventsError}
        errorMessage={liveEventsErrorMessage}
        hasNextPage={hasLiveEventsNextPage}
        isFetchingNextPage={isLiveEventsFetchingNextPage}
        onLoadMore={() => {
          void fetchLiveEventsNextPage();
        }}
        onRetry={() => {
          void refetchLiveEvents();
        }}
      />
    </section>
  );
}

import CustomTimeRangeBtn from "@/components/btn/custom-time-range-btn";
import RefreshBtn from "@/components/btn/refresh-btn";
import PowerEnvironmentalSignalsCard from "@/components/power-monitoring/environmental-signals-card";
import PowerKpiGrid from "@/components/power-monitoring/power-kpi-grid";
import PowerLatestStatusTable from "@/components/power-monitoring/latest-status-table";
import PowerTrendCard from "@/components/power-monitoring/power-trend-card";
import PowerReportingCadenceCard from "@/components/power-monitoring/reporting-cadence-card";
import PowerTelemetryCoverageCard from "@/components/power-monitoring/telemetry-coverage-card";
import PowerTelemetryProfileCard from "@/components/power-monitoring/telemetry-profile-card";
import { POWER_MONITORING_TIME_RANGES } from "@/lib/utils";
import CommonFilter from "@/components/shared/common-filter";
import CustomTimeRangeDisplay from "@/components/shared/custom-time-range-display";
import PageHeader from "@/components/shared/page-header";
import TimeRangeFilter from "@/components/shared/time-range-filter";
import { Skeleton } from "@/components/ui/skeleton";
import usePowerMonitoringData from "@/hooks/power-monitoring/use-power-monitoring-data";
import useTitle from "@/hooks/system/use-title";

export default function PowerMonitoringPage() {
  useTitle("Power Monitoring");

  const {
    customStart,
    customEnd,
    isRefreshing,
    setIsRefreshing,
    refreshPowerMonitoring,
    isLoading,
    isKpisLoading,
    isKpisError,
    kpisErrorMessage,
    isPowerTrendLoading,
    isEnvironmentalSignalsLoading,
    isTelemetryCoverageLoading,
    isTelemetryProfileLoading,
    isReportingCadenceLoading,
    isLatestStatusLoading,
    kpiMetrics,
    powerTrend,
    environmentalSignals,
    telemetryProfile,
    reportingCadence,
    telemetryCoverage,
    latestStatus,
  } = usePowerMonitoringData();

  return (
    <section className="space-y-4">
      <PageHeader
        title="Power Monitoring"
        subTitle="Voltage, power output, reporting cadence, and environmental signals across monitored devices."
        size="lg"
      />
      <div className="flex flex-wrap gap-3 items-center justify-end">
        <div className="lg:hidden">
          <CommonFilter
            isDisabled={isLoading}
            filterValue="timeRange"
            filters={POWER_MONITORING_TIME_RANGES}
            addFirst={false}
            defaultShow="1h"
            otherClasses="min-h-[40px] w-fit bg-white/4 dark:bg-white/4 border-white/8"
          />
        </div>
        <div className="hidden lg:block">
          <TimeRangeFilter isDisabled={isLoading} />
        </div>
        <CustomTimeRangeDisplay
          customStart={customStart}
          customEnd={customEnd}
          isDisabled={isLoading}
        />
        <CustomTimeRangeBtn isDisabled={isLoading} />
        <RefreshBtn
          isDisabled={isLoading}
          isRefreshing={isRefreshing}
          setIsRefreshing={setIsRefreshing}
          onAction={refreshPowerMonitoring}
          height="h-9"
        />
      </div>

      <PowerKpiGrid
        metrics={kpiMetrics}
        isLoading={isKpisLoading}
        isError={isKpisError}
        errorMessage={kpisErrorMessage}
      />

      {isPowerTrendLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <PowerTrendCard data={powerTrend} />
      )}

      {isEnvironmentalSignalsLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <PowerEnvironmentalSignalsCard data={environmentalSignals} />
      )}

      {isTelemetryProfileLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <PowerTelemetryProfileCard data={telemetryProfile} />
      )}

      <div className="grid gap-4 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          {isReportingCadenceLoading ? (
            <Skeleton className="h-125 w-full" />
          ) : (
            <PowerReportingCadenceCard data={reportingCadence} />
          )}
        </div>
        <div className="2xl:col-span-1">
          {isTelemetryCoverageLoading ? (
            <Skeleton className="h-125 w-full" />
          ) : (
            <PowerTelemetryCoverageCard data={telemetryCoverage} />
          )}
        </div>
      </div>

      {isLatestStatusLoading ? (
        <Skeleton className="h-125 w-full" />
      ) : (
        <PowerLatestStatusTable data={latestStatus} />
      )}
    </section>
  );
}

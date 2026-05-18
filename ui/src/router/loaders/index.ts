import { authApi } from "@/api";
import queryClient, {
  portsQuery,
  powerMonitoringEnvironmentalSignalsQuery,
  powerMonitoringKpisQuery,
  powerMonitoringLatestStatusQuery,
  powerMonitoringPowerTrendQuery,
  powerMonitoringReportingCadenceQuery,
  powerMonitoringTelemetryCoverageQuery,
  powerMonitoringTelemetryProfileQuery
} from "@/api/queries";
import {
  otCommunicationControlFlowQuery,
  otCommunicationControlKpisQuery,
  otCommunicationControlModbusRequestsErrorsQuery,
  otCommunicationControlModbusResponseTimeQuery,
  otCommunicationControlModbusUnitHealthQuery,
  otCommunicationControlTopFlowsInfiniteQuery,
} from "@/api/queries/communication-control-queries";
import {
  otSecurityExposureEventsOverTimeQuery,
  otSecurityExposureFiltersQuery,
  otSecurityExposureKpisQuery,
  otSecurityExposureLiveEventsInfiniteQuery,
  otSecurityExposureTopRiskySourcesQuery,
  otSecurityExposureVerdictDistributionQuery,
} from "@/api/queries/security-exposure-queries";
import { userManagementInfiniteQuery } from "@/api/queries/user-management-queries";
import {
  detectionAllowlistsQuery,
  detectionDeviceMappingsQuery,
  detectionIncidentsInfiniteQuery,
  detectionRulesQuery,
} from "@/api/queries/detection-engine-queries";
import { notificationsQuery } from "@/api/queries/notification-queries";
import { getDashboardTimeRangeQueryParams } from "@/lib/utils";
import { redirect } from "react-router";

export const rootLayoutLoader = async ({ request }: { request: Request }) => {
  const requestUrl = new URL(request.url);
  const { timeRange, customStart, customEnd } = getDashboardTimeRangeQueryParams(requestUrl.searchParams);

  await queryClient.ensureQueryData(
    otSecurityExposureFiltersQuery({
      timeRange,
      customStart,
      customEnd,
    }),
  );
  await Promise.all([
    queryClient.ensureQueryData(detectionDeviceMappingsQuery()),
    queryClient.ensureQueryData(notificationsQuery()),
  ]);

  return null;
};

export const authGuardLoader = async () => {
  try {
    const res = await authApi.get("auth/check-session")

    if (res.status !== 200) {
      return null
    }

    return redirect("/")
  } catch (error) {
    console.log(error)
    return null
  }
}

export const powerMonitoringLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(powerMonitoringKpisQuery()),
    queryClient.ensureQueryData(powerMonitoringPowerTrendQuery()),
    queryClient.ensureQueryData(powerMonitoringEnvironmentalSignalsQuery()),
    queryClient.ensureQueryData(powerMonitoringTelemetryProfileQuery()),
    queryClient.ensureQueryData(powerMonitoringReportingCadenceQuery()),
    queryClient.ensureQueryData(powerMonitoringTelemetryCoverageQuery()),
    queryClient.ensureQueryData(powerMonitoringLatestStatusQuery()),
  ])

  return null
}

export const communicationControlLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(otCommunicationControlKpisQuery()),
    queryClient.ensureQueryData(otCommunicationControlFlowQuery()),
    queryClient.ensureInfiniteQueryData(otCommunicationControlTopFlowsInfiniteQuery(),),
    queryClient.ensureQueryData(otCommunicationControlModbusResponseTimeQuery()),
    queryClient.ensureQueryData(otCommunicationControlModbusRequestsErrorsQuery()),
    queryClient.ensureQueryData(otCommunicationControlModbusUnitHealthQuery()),
  ])

  return null;
}

export const securityExposureLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(otSecurityExposureKpisQuery()),
    queryClient.ensureQueryData(otSecurityExposureEventsOverTimeQuery()),
    queryClient.ensureQueryData(otSecurityExposureVerdictDistributionQuery()),
    queryClient.ensureQueryData(otSecurityExposureTopRiskySourcesQuery()),
    queryClient.ensureInfiniteQueryData(otSecurityExposureLiveEventsInfiniteQuery({ limit: 7 })),
  ]);

  return null;
}

export const portsManagementLoader = async () => {
  await queryClient.ensureQueryData(portsQuery({}))

  return null
}

export const userManagementLoader = async () => {

  await queryClient.ensureInfiniteQueryData(userManagementInfiniteQuery())

  return null;
}

export const detectionEngineLoader = async () => {
  await Promise.all([
    queryClient.ensureQueryData(detectionRulesQuery()),
    queryClient.ensureQueryData(detectionAllowlistsQuery()),
    queryClient.ensureQueryData(detectionDeviceMappingsQuery()),
    queryClient.ensureInfiniteQueryData(
      detectionIncidentsInfiniteQuery({
        limit: 25,
      }),
    ),
  ]);

  return null;
}

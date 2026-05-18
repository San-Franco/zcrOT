/* ── Report API queries ── */
import api from '@/api';

export interface TimeRangeParams {
  customStart: string;
  customEnd: string;
}

function bp(range: TimeRangeParams) {
  return {
    timeRange: 'custom',
    customStart: range.customStart,
    customEnd: range.customEnd,
  };
}

const ENDPOINT_LABELS: Record<string, string> = {
  powerKpis: 'Power Monitoring KPIs',
  powerTrend: 'Power Trend',
  environmentalSignals: 'Environmental Signals',
  telemetryProfile: 'Telemetry Profile',
  reportingCadence: 'Reporting Cadence',
  telemetryCoverage: 'Telemetry Coverage',
  latestStatus: 'Latest Device Status',
  commKpis: 'Communication KPIs',
  commFlow: 'Communication Flow',
  commTopFlows: 'Top Communication Flows',
  modbusResponseTime: 'Modbus Response Time',
  modbusRequestsErrors: 'Modbus Requests/Errors',
  modbusUnitHealth: 'Modbus Unit Health',
  securityKpis: 'Security KPIs',
  securityEventsOverTime: 'Security Events Over Time',
  securityVerdictDist: 'Verdict Distribution',
  securityTopRisky: 'Top Risky Sources',
  deviceMappings: 'Device Name Mappings',
  detectionRules: 'Detection Rules',
  detectionIncidents: 'Detection Incidents',
};

const COMM_TOP_FLOW_PAGE_LIMIT = 200;
const COMM_TOP_FLOW_MAX_SAFE_PAGES = 200;
const DETECTION_INCIDENT_PAGE_LIMIT = 200;
const DETECTION_INCIDENT_MAX_SAFE_PAGES = 200;

export const fetchReportPowerKpis = (range: TimeRangeParams) =>
  api.get<PowerMonitoringKpisResponse>('/power-monitoring/kpis', { params: bp(range) }).then((response) => response.data);

export const fetchReportPowerTrend = (range: TimeRangeParams) =>
  api.get<PowerMonitoringPowerTrendResponse>('/power-monitoring/power-trend', { params: bp(range) }).then((response) => response.data);

export const fetchReportEnvironmentalSignals = (range: TimeRangeParams) =>
  api.get<PowerMonitoringEnvironmentalSignalsResponse>('/power-monitoring/environmental-signals', { params: bp(range) }).then((response) => response.data);

export const fetchReportTelemetryProfile = (range: TimeRangeParams) =>
  api.get<PowerMonitoringTelemetryProfileResponse>('/power-monitoring/telemetry-profile', { params: bp(range) }).then((response) => response.data);

export const fetchReportReportingCadence = (range: TimeRangeParams) =>
  api.get<PowerMonitoringReportingCadenceResponse>('/power-monitoring/reporting-cadence', { params: bp(range) }).then((response) => response.data);

export const fetchReportTelemetryCoverage = (range: TimeRangeParams) =>
  api.get<PowerMonitoringTelemetryCoverageResponse>('/power-monitoring/telemetry-coverage', { params: bp(range) }).then((response) => response.data);

export const fetchReportLatestStatus = (range: TimeRangeParams) =>
  api.get<PowerMonitoringLatestStatusResponse>('/power-monitoring/latest-status', { params: bp(range) }).then((response) => response.data);

export const fetchReportCommKpis = (range: TimeRangeParams) =>
  api.get<OtCommunicationControlKpisResponse>('/ot-communication/kpis', { params: bp(range) }).then((response) => response.data);

export const fetchReportCommFlow = (range: TimeRangeParams) =>
  api.get<OtCommunicationControlFlowResponse>('/ot-communication/communication-flow', { params: bp(range) }).then((response) => response.data);

async function fetchReportCommTopFlowsPage(
  range: TimeRangeParams,
  offset: number,
): Promise<OtCommunicationControlTopFlowsResponse> {
  const response = await api.get<OtCommunicationControlTopFlowsResponse>('/ot-communication/top-communication-flows', {
    params: {
      ...bp(range),
      limit: COMM_TOP_FLOW_PAGE_LIMIT,
      offset,
    },
  });

  return response.data;
}

export async function fetchReportCommTopFlows(range: TimeRangeParams): Promise<OtCommunicationControlTopFlowsResponse> {
  const firstPage = await fetchReportCommTopFlowsPage(range, 0);
  const firstRows = firstPage.rows ?? [];
  const mergedRows: OtCommunicationTopFlowApiRow[] = [...firstRows];

  const firstPageSize = firstPage.per_page > 0 ? firstPage.per_page : firstRows.length;
  let nextOffset = firstPageSize;
  let hasMore = firstPage.has_more;
  let safetyCounter = 1;

  while (hasMore && safetyCounter < COMM_TOP_FLOW_MAX_SAFE_PAGES) {
    const page = await fetchReportCommTopFlowsPage(range, nextOffset);
    const pageRows = page.rows ?? [];
    const pageSize = page.per_page > 0 ? page.per_page : pageRows.length;

    if (pageRows.length === 0 || pageSize === 0) {
      break;
    }

    mergedRows.push(...pageRows);
    hasMore = page.has_more;
    nextOffset += pageSize;
    safetyCounter += 1;
  }

  return {
    ...firstPage,
    rows: mergedRows,
    page: 1,
    per_page: mergedRows.length,
    has_more: false,
    total: firstPage.total,
  };
}

export const fetchReportModbusResponseTime = (range: TimeRangeParams) =>
  api.get<OtCommunicationControlModbusResponseTimeResponse>('/ot-communication/modbus-response-time-by-unit', { params: bp(range) }).then((response) => response.data);

export const fetchReportModbusRequestsErrors = (range: TimeRangeParams) =>
  api.get<OtCommunicationControlModbusRequestsErrorsResponse>('/ot-communication/modbus-requests-vs-errors', { params: bp(range) }).then((response) => response.data);

export const fetchReportModbusUnitHealth = (range: TimeRangeParams) =>
  api.get<OtCommunicationControlModbusUnitHealthResponse>('/ot-communication/modbus-unit-health', { params: bp(range) }).then((response) => response.data);

export const fetchReportSecurityKpis = (range: TimeRangeParams) =>
  api.get<OtSecurityExposureKpisResponse>('/ot-security-exposure/kpis', { params: bp(range) }).then((response) => response.data);

export const fetchReportSecurityEventsOverTime = (range: TimeRangeParams) =>
  api.get<OtSecurityExposureEventsOverTimeResponse>('/ot-security-exposure/events-over-time', { params: bp(range) }).then((response) => response.data);

export const fetchReportSecurityVerdictDist = (range: TimeRangeParams) =>
  api.get<OtSecurityExposureVerdictDistributionResponse>('/ot-security-exposure/verdict-distribution', { params: bp(range) }).then((response) => response.data);

export const fetchReportSecurityTopRisky = (range: TimeRangeParams) =>
  api.get<OtSecurityExposureTopRiskySourcesResponse>('/ot-security-exposure/top-risky-sources', { params: bp(range) }).then((response) => response.data);

export const fetchReportDeviceMappings = () =>
  api.get<DetectionDeviceNameMappingApiRow[]>('/detection-engine/device-mappings').then((response) => response.data);

export const fetchReportDetectionRules = () =>
  api.get<DetectionRuleApiRow[]>('/detection-engine/rules').then((response) => response.data);

async function fetchReportDetectionIncidentsPage(offset: number): Promise<DetectionIncidentsResponse> {
  const response = await api.get<DetectionIncidentsResponse>('/detection-engine/incidents', {
    params: {
      limit: DETECTION_INCIDENT_PAGE_LIMIT,
      offset,
    },
  });

  return response.data;
}

export async function fetchReportDetectionIncidents(): Promise<DetectionIncidentsResponse> {
  const firstPage = await fetchReportDetectionIncidentsPage(0);
  const firstRows = firstPage.rows ?? [];
  const mergedRows: DetectionIncidentApiRow[] = [...firstRows];

  const firstPageSize = firstPage.per_page > 0 ? firstPage.per_page : firstRows.length;
  let nextOffset = firstPageSize;
  let hasMore = firstPage.has_more;
  let safetyCounter = 1;

  while (hasMore && safetyCounter < DETECTION_INCIDENT_MAX_SAFE_PAGES) {
    const page = await fetchReportDetectionIncidentsPage(nextOffset);
    const pageRows = page.rows ?? [];
    const pageSize = page.per_page > 0 ? page.per_page : pageRows.length;

    if (pageRows.length === 0 || pageSize === 0) {
      break;
    }

    mergedRows.push(...pageRows);
    hasMore = page.has_more;
    nextOffset += pageSize;
    safetyCounter += 1;
  }

  return {
    ...firstPage,
    rows: mergedRows,
    page: 1,
    per_page: mergedRows.length,
    has_more: false,
    total: firstPage.total,
  };
}

export interface AllReportDataResult {
  powerKpis: PowerMonitoringKpisResponse | null;
  powerTrend: PowerMonitoringPowerTrendResponse | null;
  environmentalSignals: PowerMonitoringEnvironmentalSignalsResponse | null;
  telemetryProfile: PowerMonitoringTelemetryProfileResponse | null;
  reportingCadence: PowerMonitoringReportingCadenceResponse | null;
  telemetryCoverage: PowerMonitoringTelemetryCoverageResponse | null;
  latestStatus: PowerMonitoringLatestStatusResponse | null;
  commKpis: OtCommunicationControlKpisResponse | null;
  commFlow: OtCommunicationControlFlowResponse | null;
  commTopFlows: OtCommunicationControlTopFlowsResponse | null;
  modbusResponseTime: OtCommunicationControlModbusResponseTimeResponse | null;
  modbusRequestsErrors: OtCommunicationControlModbusRequestsErrorsResponse | null;
  modbusUnitHealth: OtCommunicationControlModbusUnitHealthResponse | null;
  securityKpis: OtSecurityExposureKpisResponse | null;
  securityEventsOverTime: OtSecurityExposureEventsOverTimeResponse | null;
  securityVerdictDist: OtSecurityExposureVerdictDistributionResponse | null;
  securityTopRisky: OtSecurityExposureTopRiskySourcesResponse | null;
  deviceMappings: DetectionDeviceNameMappingApiRow[] | null;
  detectionRules: DetectionRuleApiRow[] | null;
  detectionIncidents: DetectionIncidentApiRow[] | null;
  failedEndpoints: string[];
}

const ENDPOINT_KEYS: (keyof Omit<AllReportDataResult, 'failedEndpoints'>)[] = [
  'powerKpis',
  'powerTrend',
  'environmentalSignals',
  'telemetryProfile',
  'reportingCadence',
  'telemetryCoverage',
  'latestStatus',
  'commKpis',
  'commFlow',
  'commTopFlows',
  'modbusResponseTime',
  'modbusRequestsErrors',
  'modbusUnitHealth',
  'securityKpis',
  'securityEventsOverTime',
  'securityVerdictDist',
  'securityTopRisky',
  'deviceMappings',
  'detectionRules',
  'detectionIncidents',
];

export async function fetchAllReportData(range: TimeRangeParams): Promise<AllReportDataResult> {
  const requests = await Promise.allSettled([
    fetchReportPowerKpis(range),
    fetchReportPowerTrend(range),
    fetchReportEnvironmentalSignals(range),
    fetchReportTelemetryProfile(range),
    fetchReportReportingCadence(range),
    fetchReportTelemetryCoverage(range),
    fetchReportLatestStatus(range),
    fetchReportCommKpis(range),
    fetchReportCommFlow(range),
    fetchReportCommTopFlows(range),
    fetchReportModbusResponseTime(range),
    fetchReportModbusRequestsErrors(range),
    fetchReportModbusUnitHealth(range),
    fetchReportSecurityKpis(range),
    fetchReportSecurityEventsOverTime(range),
    fetchReportSecurityVerdictDist(range),
    fetchReportSecurityTopRisky(range),
    fetchReportDeviceMappings(),
    fetchReportDetectionRules(),
    fetchReportDetectionIncidents(),
  ]);

  const failedEndpoints: string[] = [];

  function extractValue<T>(result: PromiseSettledResult<T>, index: number): T | null {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    const endpointKey = ENDPOINT_KEYS[index];
    failedEndpoints.push(ENDPOINT_LABELS[endpointKey] ?? endpointKey);
    return null;
  }

  return {
    powerKpis: extractValue(requests[0], 0),
    powerTrend: extractValue(requests[1], 1),
    environmentalSignals: extractValue(requests[2], 2),
    telemetryProfile: extractValue(requests[3], 3),
    reportingCadence: extractValue(requests[4], 4),
    telemetryCoverage: extractValue(requests[5], 5),
    latestStatus: extractValue(requests[6], 6),
    commKpis: extractValue(requests[7], 7),
    commFlow: extractValue(requests[8], 8),
    commTopFlows: extractValue(requests[9], 9),
    modbusResponseTime: extractValue(requests[10], 10),
    modbusRequestsErrors: extractValue(requests[11], 11),
    modbusUnitHealth: extractValue(requests[12], 12),
    securityKpis: extractValue(requests[13], 13),
    securityEventsOverTime: extractValue(requests[14], 14),
    securityVerdictDist: extractValue(requests[15], 15),
    securityTopRisky: extractValue(requests[16], 16),
    deviceMappings: extractValue(requests[17], 17),
    detectionRules: extractValue(requests[18], 18),
    detectionIncidents: extractValue(requests[19], 19)?.rows ?? null,
    failedEndpoints,
  };
}

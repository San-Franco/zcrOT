import { format } from 'date-fns';
import { KNOWN_LIMITATIONS } from '../constants';
import type {
  ConclusionPageInput,
  DetectionFeasibilityRow,
  ReportAiEvidencePack,
  ReportCommunicationMetrics,
  ReportCoverageMetrics,
  ReportData,
  ReportDetectionMetrics,
  ReportDeviceMetrics,
  ReportIncidentGroupRow,
  ReportIncidentMetrics,
  ReportMetrics,
  ReportNarrativeSummary,
  ReportOtAssetMetrics,
  ReportRiskMetrics,
  ReportRiskSourceRow,
  RiskItem,
  SectionId,
} from '../types';

const HIGH_RISK_FLOW_THRESHOLD = 70;
const CRITICAL_RISK_SCORE_THRESHOLD = 80;
const INCIDENT_MAX_GROUPS = 5;
const AI_PATH_EXAMPLES = 5;
const AI_PROTOCOL_EXAMPLES = 5;
const AI_RISK_SOURCE_EXAMPLES = 5;
const AI_INCIDENT_GROUP_EXAMPLES = 5;
const PLATFORM_DEFAULT_RULE_COUNT = 12;

const SEVERITY_ORDER: Record<string, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface VisibilityCoverageRow {
  item: string;
  status: string;
  confidence: string;
  explanation: string;
}

export interface TrendComparisonRow {
  metric: string;
  previous: string;
  current: string;
  change: string;
}

export interface ActionGroup {
  title: string;
  tone: 'immediate' | 'short-term' | 'architecture';
  items: string[];
}

function parseMetricNumber(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replaceAll(',', '').replace('%', '');
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getKpiMetricValue(
  metrics: Array<{ id: string; value: string }> | undefined,
  metricId: string,
): number | null {
  const metric = metrics?.find((item) => item.id === metricId);
  if (!metric) {
    return null;
  }

  return parseMetricNumber(metric.value);
}

function safeNumber(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function normalizeIpForComparison(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (lowered === '-' || lowered === 'unknown' || lowered === 'n/a') {
    return null;
  }

  return lowered;
}

function normalizeIpForDisplay(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (lowered === '-' || lowered === 'unknown' || lowered === 'n/a') {
    return null;
  }

  return normalized;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeUnitId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const normalized = Math.trunc(value);
  return normalized >= 0 ? normalized : null;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return Math.round(value);
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

function toneByThreshold(value: number, low = 0, high = 5): 'good' | 'warning' | 'danger' {
  if (value <= low) {
    return 'good';
  }

  if (value <= high) {
    return 'warning';
  }

  return 'danger';
}

function getSeverityLabel(value: string): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'critical' || normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  return 'info';
}

function maxSeverity(
  left: 'info' | 'low' | 'medium' | 'high' | 'critical',
  right: 'info' | 'low' | 'medium' | 'high' | 'critical',
): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  return SEVERITY_ORDER[right] > SEVERITY_ORDER[left] ? right : left;
}

type IncidentGroupStrategy = 'category' | 'title' | 'rule_ids' | 'severity';

function overlapsWindow(
  startAt: Date | null,
  endAt: Date | null,
  windowStart: Date | null,
  windowEnd: Date | null,
): boolean {
  if (!windowStart || !windowEnd) {
    return true;
  }

  const normalizedStart = startAt ?? endAt;
  const normalizedEnd = endAt ?? startAt;

  if (!normalizedStart && !normalizedEnd) {
    return false;
  }

  const startTime = (normalizedStart ?? normalizedEnd)?.getTime() ?? Number.NaN;
  const endTime = (normalizedEnd ?? normalizedStart)?.getTime() ?? Number.NaN;

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return false;
  }

  const rangeStart = Math.min(startTime, endTime);
  const rangeEnd = Math.max(startTime, endTime);
  const windowStartTime = windowStart.getTime();
  const windowEndTime = windowEnd.getTime();

  return rangeStart <= windowEndTime && rangeEnd >= windowStartTime;
}

function deriveDateRange(data: ReportData) {
  const start = parseDate(data.config.startDate);
  const end = parseDate(data.config.endDate);

  const startLabel = start ? format(start, 'dd MMM yyyy') : data.config.startDate;
  const endLabel = end ? format(end, 'dd MMM yyyy') : data.config.endDate;

  return {
    startIso: data.config.startDate,
    endIso: data.config.endDate,
    startLabel,
    endLabel,
    periodLabel: `${startLabel} to ${endLabel}`,
  };
}

function buildMappedIpNameMap(
  mappings: DetectionDeviceNameMappingApiRow[] | null | undefined,
): Map<string, string> {
  const mappedIpNameMap = new Map<string, string>();

  for (const mapping of mappings ?? []) {
    const ipKey = normalizeIpForComparison(mapping.ip_address);
    const displayName = normalizeText(mapping.display_name);

    if (
      mapping.mapping_type === 'ip'
      && mapping.is_active
      && ipKey
      && displayName.length > 0
    ) {
      mappedIpNameMap.set(ipKey, displayName);
    }
  }

  return mappedIpNameMap;
}

function buildMappedUnitNameMap(data: ReportData): Map<number, string> {
  const mappedUnitNameMap = new Map<number, string>();

  for (const mapping of data.deviceMappings ?? []) {
    const unitId = normalizeUnitId(mapping.unit_id);
    const displayName = normalizeText(mapping.display_name);

    if (
      mapping.mapping_type === 'modbus_unit'
      && mapping.is_active
      && unitId !== null
      && displayName.length > 0
    ) {
      mappedUnitNameMap.set(unitId, displayName);
    }
  }

  for (const row of data.latestStatus?.rows ?? []) {
    const unitId = normalizeUnitId(row.unit_id);
    const deviceName = normalizeText(row.device_name);

    if (unitId !== null && deviceName.length > 0 && !mappedUnitNameMap.has(unitId)) {
      mappedUnitNameMap.set(unitId, deviceName);
    }
  }

  return mappedUnitNameMap;
}

function buildObservedIpSet(rows: OtCommunicationTopFlowApiRow[] | undefined): Set<string> {
  const observedIps = new Set<string>();

  for (const row of rows ?? []) {
    const sourceIp = normalizeIpForComparison(row.source_ip);
    const destinationIp = normalizeIpForComparison(row.destination_ip);

    if (sourceIp) {
      observedIps.add(sourceIp);
    }

    if (destinationIp) {
      observedIps.add(destinationIp);
    }
  }

  return observedIps;
}

function deriveOtAssetMetrics(data: ReportData): ReportOtAssetMetrics {
  const unitMap = new Map<number, {
    unitId: number;
    assetName: string;
    health: string;
    lastSeen: string;
    freshnessMinutes: number | null;
  }>();

  for (const row of data.latestStatus?.rows ?? []) {
    const unitId = normalizeUnitId(row.unit_id);
    if (unitId === null) {
      continue;
    }

    const assetName = normalizeText(row.device_name) || `Unit ${unitId}`;
    const health = normalizeText(row.health) || 'Unknown';
    const lastSeen = row.last_seen;
    const freshnessMinutes = typeof row.freshness_minutes === 'number' && Number.isFinite(row.freshness_minutes)
      ? row.freshness_minutes
      : null;

    const existing = unitMap.get(unitId);
    if (!existing) {
      unitMap.set(unitId, {
        unitId,
        assetName,
        health,
        lastSeen,
        freshnessMinutes,
      });
      continue;
    }

    const existingSeenTime = parseDate(existing.lastSeen)?.getTime() ?? 0;
    const nextSeenTime = parseDate(lastSeen)?.getTime() ?? 0;
    if (nextSeenTime >= existingSeenTime) {
      unitMap.set(unitId, {
        unitId,
        assetName,
        health,
        lastSeen,
        freshnessMinutes,
      });
    }
  }

  for (const row of data.modbusUnitHealth?.rows ?? []) {
    const unitId = normalizeUnitId(row.unit_id);
    if (unitId === null || unitMap.has(unitId)) {
      continue;
    }

    unitMap.set(unitId, {
      unitId,
      assetName: `Unit ${unitId}`,
      health: 'Unknown',
      lastSeen: '',
      freshnessMinutes: null,
    });
  }

  for (const point of data.modbusResponseTime?.points ?? []) {
    const unitId = normalizeUnitId(point.unit_id);
    if (unitId === null || unitMap.has(unitId)) {
      continue;
    }

    unitMap.set(unitId, {
      unitId,
      assetName: `Unit ${unitId}`,
      health: 'Unknown',
      lastSeen: '',
      freshnessMinutes: null,
    });
  }

  const otAssets = Array.from(unitMap.values()).sort((left, right) => left.unitId - right.unitId);

  const reportingUnitCount = otAssets.filter((asset) => {
    const health = asset.health.toLowerCase();
    return health !== 'stale' && health !== 'missing' && health !== 'offline';
  }).length;

  const staleOrMissingUnitCount = otAssets.filter((asset) => {
    const health = asset.health.toLowerCase();
    return health === 'stale' || health === 'missing' || health === 'offline';
  }).length;

  const summary = otAssets.length > 0
    ? `${formatCount(otAssets.length)} OT unit-based assets were observed in-period, with ${formatCount(staleOrMissingUnitCount)} marked stale/missing/offline.`
    : 'No OT unit_id asset evidence was available in this reporting window.';

  return {
    otAssetCount: otAssets.length,
    reportingUnitCount,
    staleOrMissingUnitCount,
    otAssets,
    summary,
  };
}

function deriveDeviceMetrics(
  data: ReportData,
  mappedIpNameMap: Map<string, string>,
  observedIps: Set<string>,
): ReportDeviceMetrics {
  const unknownObservedIps = new Set<string>();

  for (const observedIp of observedIps) {
    if (!mappedIpNameMap.has(observedIp)) {
      unknownObservedIps.add(observedIp);
    }
  }

  const observedMappedDevices = Array.from(observedIps).filter((ip) => mappedIpNameMap.has(ip)).length;

  const observedAssetsFromKpi = getKpiMetricValue(data.commKpis?.metrics, 'active-assets');
  const observedAssets = observedIps.size > 0
    ? observedIps.size
    : observedAssetsFromKpi !== null
      ? Math.max(Math.round(observedAssetsFromKpi), 0)
      : 0;

  const telemetryCoverageItems = data.telemetryCoverage?.items ?? [];
  const reportingNormally = telemetryCoverageItems.find((item) => item.coverage_key === 'reportingNormally')?.value ?? 0;
  const limitedTelemetry = telemetryCoverageItems.find((item) => item.coverage_key === 'limitedTelemetry')?.value ?? 0;
  const staleOrMissing = telemetryCoverageItems.find((item) => item.coverage_key === 'staleOrMissing')?.value ?? 0;

  const telemetryAssets = (data.latestStatus?.rows ?? []).map((row) => ({
    assetName: normalizeText(row.device_name) || `Unit ${row.unit_id}`,
    deviceType: normalizeText(row.device_type) || 'Unknown',
    unitId: typeof row.unit_id === 'number' ? row.unit_id : null,
    site: normalizeText(row.site) || 'Unknown',
    lastSeen: row.last_seen,
    health: row.health ?? 'Unknown',
    freshnessMinutes: typeof row.freshness_minutes === 'number' ? row.freshness_minutes : null,
  }));

  const healthyTelemetryAssets = telemetryAssets.filter((asset) => asset.health === 'Healthy').length;
  const mappingCoveragePercent = observedAssets > 0
    ? clampPercent((observedMappedDevices / observedAssets) * 100)
    : 0;

  return {
    observedAssets,
    knownDevices: mappedIpNameMap.size,
    unknownDevices: unknownObservedIps.size,
    observedMappedDevices,
    mappingCoveragePercent,
    telemetryAssetCount: telemetryAssets.length,
    reportingNormally,
    limitedTelemetry,
    staleOrMissing,
    healthyTelemetryAssets,
    telemetryAssets,
  };
}

function deriveCommunicationMetrics(data: ReportData): ReportCommunicationMetrics {
  const rows = data.commTopFlows?.rows ?? [];

  const communicationPaths = rows.length;
  const internalPaths = rows.filter((row) => normalizeText(row.direction).toLowerCase() === 'internal').length;
  const externalPaths = rows.filter((row) => normalizeText(row.direction).toLowerCase() === 'external').length;
  const unknownDirectionPaths = rows.filter((row) => {
    const direction = normalizeText(row.direction).toLowerCase();
    return direction !== 'internal' && direction !== 'external';
  }).length;

  const flowEvents = rows.reduce((sum, row) => sum + safeNumber(row.event_count), 0);
  const unknownClientEvents = rows.reduce((sum, row) => sum + safeNumber(row.unknown_client_events), 0);
  const outsideHoursEvents = rows.reduce((sum, row) => sum + safeNumber(row.outside_hours_events), 0);
  const likelyAttackFlowEvents = rows.reduce((sum, row) => sum + safeNumber(row.likely_attack_events), 0);
  const modbusDisruptedEvents = rows.reduce((sum, row) => sum + safeNumber(row.modbus_disrupted_events), 0);

  const highRiskRows = rows.filter((row) => safeNumber(row.max_risk_score) >= HIGH_RISK_FLOW_THRESHOLD);
  const highRiskFlows = highRiskRows.length;
  const highRiskFlowEvents = highRiskRows.reduce((sum, row) => sum + safeNumber(row.event_count), 0);

  const riskSourceSet = new Set<string>();
  for (const row of highRiskRows) {
    const sourceIp = normalizeIpForComparison(row.source_ip);
    if (sourceIp) {
      riskSourceSet.add(sourceIp);
    }
  }

  const participantWeights = new Map<string, number>();
  for (const row of rows) {
    const sourceIp = normalizeIpForDisplay(row.source_ip);
    const destinationIp = normalizeIpForDisplay(row.destination_ip);
    const eventCount = safeNumber(row.event_count);

    if (sourceIp) {
      participantWeights.set(sourceIp, (participantWeights.get(sourceIp) ?? 0) + eventCount);
    }

    if (destinationIp) {
      participantWeights.set(destinationIp, (participantWeights.get(destinationIp) ?? 0) + eventCount);
    }
  }

  const primaryParticipant = Array.from(participantWeights.entries())
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'No participant observed';

  const protocolMap = new Map<string, number>();
  for (const row of rows) {
    const protocol = normalizeText(row.protocol).toUpperCase() || 'UNKNOWN';
    protocolMap.set(protocol, (protocolMap.get(protocol) ?? 0) + safeNumber(row.event_count));
  }

  const protocolBreakdown = Array.from(protocolMap.entries())
    .map(([protocol, events]) => ({ protocol, events }))
    .sort((left, right) => right.events - left.events);

  const modbusRequests = (data.modbusRequestsErrors?.points ?? [])
    .reduce((sum, point) => sum + safeNumber(point.total_requests), 0);

  const modbusErrors = (data.modbusRequestsErrors?.points ?? [])
    .reduce((sum, point) => sum + safeNumber(point.total_errors), 0);

  const modbusSlowPolls = (data.modbusUnitHealth?.rows ?? [])
    .reduce((sum, row) => sum + safeNumber(row.slow_count), 0);

  const unitDisplayNameMap = buildMappedUnitNameMap(data);
  const responseByUnit = new Map<number, { sum: number; count: number; max: number }>();
  for (const point of data.modbusResponseTime?.points ?? []) {
    const unitId = normalizeUnitId(point.unit_id);
    const avgResponse = safeNumber(point.avg_response_time_ms);
    if (unitId === null || avgResponse <= 0) {
      continue;
    }

    const existing = responseByUnit.get(unitId);
    if (!existing) {
      responseByUnit.set(unitId, {
        sum: avgResponse,
        count: 1,
        max: avgResponse,
      });
      continue;
    }

    existing.sum += avgResponse;
    existing.count += 1;
    if (avgResponse > existing.max) {
      existing.max = avgResponse;
    }
  }

  const unitControlRows = (data.modbusUnitHealth?.rows ?? [])
    .map((row) => {
      const unitId = normalizeUnitId(row.unit_id);
      if (unitId === null) {
        return null;
      }

      const totalRequests = safeNumber(row.total_requests);
      const successCount = safeNumber(row.success_count);
      const errorCount = safeNumber(row.error_count);
      const slowCount = safeNumber(row.slow_count);

      const hasControlEvidence = totalRequests > 0 || successCount > 0 || errorCount > 0 || slowCount > 0;
      const responseAggregate = responseByUnit.get(unitId);
      if (!hasControlEvidence && !responseAggregate) {
        return null;
      }

      const avgResponseFromHealth = safeNumber(row.response_time_avg_ms);
      const maxResponseFromHealth = safeNumber(row.response_time_max_ms);
      const avgResponseTimeMs = avgResponseFromHealth > 0
        ? avgResponseFromHealth
        : responseAggregate
          ? responseAggregate.sum / responseAggregate.count
          : null;
      const maxResponseTimeMs = maxResponseFromHealth > 0
        ? maxResponseFromHealth
        : responseAggregate
          ? responseAggregate.max
          : null;

      const successRate = totalRequests > 0
        ? clampPercent((successCount / totalRequests) * 100)
        : 0;

      return {
        unitId,
        unitLabel: unitDisplayNameMap.get(unitId) ?? `Unit ${unitId}`,
        totalRequests,
        successCount,
        errorCount,
        slowCount,
        successRate,
        avgResponseTimeMs,
        maxResponseTimeMs,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((left, right) => {
      if (right.totalRequests !== left.totalRequests) {
        return right.totalRequests - left.totalRequests;
      }

      if (right.errorCount !== left.errorCount) {
        return right.errorCount - left.errorCount;
      }

      if (right.slowCount !== left.slowCount) {
        return right.slowCount - left.slowCount;
      }

      return left.unitId - right.unitId;
    });

  const otUnitParticipationCount = unitControlRows.length;
  const otUnitsWithErrors = unitControlRows.filter((row) => row.errorCount > 0).length;
  const otUnitsWithSlowPolls = unitControlRows.filter((row) => row.slowCount > 0).length;
  const topOtControlUnits = unitControlRows.slice(0, 5);
  const primaryOtControlUnit = topOtControlUnits[0]
    ? `${topOtControlUnits[0].unitLabel} (Unit ${topOtControlUnits[0].unitId})`
    : 'No OT unit-level control evidence';
  const otControlSummary = otUnitParticipationCount === 0
    ? 'No unit_id-linked Modbus polling evidence was available in the selected period.'
    : `${formatCount(otUnitParticipationCount)} OT units showed polling activity; ${formatCount(otUnitsWithErrors)} units logged errors and ${formatCount(otUnitsWithSlowPolls)} units showed slow polling behavior.`;

  const modbusSuccessRate = modbusRequests > 0
    ? clampPercent(((modbusRequests - modbusErrors) / modbusRequests) * 100)
    : 100;

  let controlStability: ReportCommunicationMetrics['controlStability'] = 'Stable';
  if (modbusSuccessRate < 90) {
    controlStability = 'Degraded';
  } else if (modbusSuccessRate < 98) {
    controlStability = 'Watch';
  }

  const controlReliabilitySummary = modbusRequests <= 0
    ? 'No Modbus request sample was available for control reliability scoring in this reporting window.'
    : controlStability === 'Stable'
      ? `Control reliability was stable with ${modbusSuccessRate}% success across ${formatCount(modbusRequests)} Modbus requests.`
      : controlStability === 'Watch'
        ? `Control reliability requires watch-level review: ${modbusSuccessRate}% success with ${formatCount(modbusErrors)} errors.`
        : `Control reliability was degraded: ${modbusSuccessRate}% success with ${formatCount(modbusErrors)} errors and ${formatCount(modbusSlowPolls)} slow polls.`;

  const notablePaths = [...rows]
    .sort((left, right) => {
      const leftRelevance = (
        (safeNumber(left.max_risk_score) * 1000)
        + (safeNumber(left.likely_attack_events) * 120)
        + (safeNumber(left.unknown_client_events) * 40)
        + (safeNumber(left.outside_hours_events) * 20)
        + safeNumber(left.event_count)
      );
      const rightRelevance = (
        (safeNumber(right.max_risk_score) * 1000)
        + (safeNumber(right.likely_attack_events) * 120)
        + (safeNumber(right.unknown_client_events) * 40)
        + (safeNumber(right.outside_hours_events) * 20)
        + safeNumber(right.event_count)
      );

      if (rightRelevance !== leftRelevance) {
        return rightRelevance - leftRelevance;
      }

      if (safeNumber(right.max_risk_score) !== safeNumber(left.max_risk_score)) {
        return safeNumber(right.max_risk_score) - safeNumber(left.max_risk_score);
      }

      if (safeNumber(right.event_count) !== safeNumber(left.event_count)) {
        return safeNumber(right.event_count) - safeNumber(left.event_count);
      }

      const leftKey = [
        normalizeText(left.source_ip),
        normalizeText(left.destination_ip),
        normalizeText(left.protocol),
        normalizeText(left.port),
      ].join('|');
      const rightKey = [
        normalizeText(right.source_ip),
        normalizeText(right.destination_ip),
        normalizeText(right.protocol),
        normalizeText(right.port),
      ].join('|');
      return leftKey.localeCompare(rightKey);
    })
    .slice(0, 5)
    .map((row) => ({
      sourceIp: normalizeIpForDisplay(row.source_ip) ?? '-',
      destinationIp: normalizeIpForDisplay(row.destination_ip) ?? '-',
      protocol: normalizeText(row.protocol) || '-',
      port: normalizeText(row.port) || '-',
      direction: normalizeText(row.direction) || '-',
      eventCount: safeNumber(row.event_count),
      unknownClientEvents: safeNumber(row.unknown_client_events),
      likelyAttackEvents: safeNumber(row.likely_attack_events),
      outsideHoursEvents: safeNumber(row.outside_hours_events),
      maxRiskScore: safeNumber(row.max_risk_score),
      avgRiskScore: safeNumber(row.avg_risk_score),
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
    }));

  return {
    communicationPaths,
    internalPaths,
    externalPaths,
    unknownDirectionPaths,
    flowEvents,
    unknownClientEvents,
    outsideHoursEvents,
    likelyAttackFlowEvents,
    modbusDisruptedEvents,
    highRiskFlows,
    highRiskFlowEvents,
    riskSources: riskSourceSet.size,
    primaryParticipant,
    modbusRequests,
    modbusErrors,
    modbusSlowPolls,
    modbusSuccessRate,
    controlStability,
    otUnitParticipationCount,
    otUnitsWithErrors,
    otUnitsWithSlowPolls,
    primaryOtControlUnit,
    otControlSummary,
    topOtControlUnits,
    controlReliabilitySummary,
    protocolBreakdown,
    notablePaths,
  };
}

function deriveRiskMetrics(data: ReportData, communication: ReportCommunicationMetrics): ReportRiskMetrics {
  const severity = (data.securityEventsOverTime?.rows ?? []).reduce(
    (totals, row) => ({
      low: totals.low + safeNumber(row.low),
      medium: totals.medium + safeNumber(row.medium),
      high: totals.high + safeNumber(row.high),
      critical: totals.critical + safeNumber(row.critical),
    }),
    { low: 0, medium: 0, high: 0, critical: 0 },
  );

  const verdict = (data.securityVerdictDist?.rows ?? []).reduce(
    (totals, row) => ({
      likelyLegitimate: totals.likelyLegitimate + safeNumber(row.likely_legitimate),
      likelyLegitimateUnknownIp: totals.likelyLegitimateUnknownIp + safeNumber(row.likely_legitimate_unknown_ip),
      underInvestigation: totals.underInvestigation + safeNumber(row.under_investigation),
      likelyAttack: totals.likelyAttack + safeNumber(row.likely_attack),
    }),
    {
      likelyLegitimate: 0,
      likelyLegitimateUnknownIp: 0,
      underInvestigation: 0,
      likelyAttack: 0,
    },
  );

  const totalSecurityEvents = severity.low + severity.medium + severity.high + severity.critical;
  const highSeverityEvents = severity.high + severity.critical;

  const unknownClientFromKpi = getKpiMetricValue(data.securityKpis?.metrics, 'unknown-host-events');
  const likelyAttackFromKpi = getKpiMetricValue(data.securityKpis?.metrics, 'likely-attack-events');
  const externalOriginFromKpi = getKpiMetricValue(data.securityKpis?.metrics, 'external-source-events');
  const unknownClientEvents = unknownClientFromKpi !== null
    ? Math.max(Math.round(unknownClientFromKpi), 0)
    : verdict.likelyLegitimateUnknownIp;
  const likelyAttackEvents = likelyAttackFromKpi !== null
    ? Math.max(Math.round(likelyAttackFromKpi), 0)
    : verdict.likelyAttack;
  const externalOriginEvents = externalOriginFromKpi !== null
    ? Math.max(Math.round(externalOriginFromKpi), 0)
    : 0;

  const topRiskSources: ReportRiskSourceRow[] = (data.securityTopRisky?.rows ?? []).map((row) => ({
    sourceIp: normalizeIpForDisplay(row.source_ip) ?? 'Unknown',
    eventCount: safeNumber(row.event_count),
    maxRiskScore: safeNumber(row.max_risk_score),
    avgRiskScore: safeNumber(row.avg_risk_score),
  }));

  const maxRiskScore = topRiskSources.length > 0
    ? Math.max(...topRiskSources.map((row) => row.maxRiskScore))
    : 0;

  const avgRiskScore = topRiskSources.length > 0
    ? topRiskSources.reduce((sum, row) => sum + row.avgRiskScore, 0) / topRiskSources.length
    : 0;

  let riskPosture: ReportRiskMetrics['riskPosture'] = 'Low';
  if (
    highSeverityEvents >= 10
    || likelyAttackEvents >= 5
    || communication.riskSources >= 3
    || maxRiskScore >= CRITICAL_RISK_SCORE_THRESHOLD
  ) {
    riskPosture = 'High';
  } else if (
    highSeverityEvents > 0
    || likelyAttackEvents > 0
    || communication.riskSources > 0
    || externalOriginEvents > 0
  ) {
    riskPosture = 'Medium';
  }

  return {
    totalSecurityEvents,
    highSeverityEvents,
    severity,
    verdict,
    unknownClientEvents,
    likelyAttackEvents,
    externalOriginEvents,
    riskSources: communication.riskSources,
    maxRiskScore,
    avgRiskScore,
    topRiskSources,
    riskPosture,
  };
}

function resolveIncidentGroupKey(
  incident: DetectionIncidentApiRow,
): { groupKey: string; strategy: IncidentGroupStrategy } {
  const candidateFields = [
    'category',
    'incident_category',
    'incident_type',
    'type',
    'threat_type',
    'classification',
  ];
  const incidentRecord = incident as unknown as Record<string, unknown>;

  for (const field of candidateFields) {
    const value = incidentRecord[field];
    const normalized = typeof value === 'string' ? normalizeText(value) : '';
    if (normalized.length > 0) {
      return {
        groupKey: `Category: ${normalized}`,
        strategy: 'category',
      };
    }
  }

  const title = normalizeText(incident.title);
  if (title.length > 0) {
    return {
      groupKey: title,
      strategy: 'title',
    };
  }

  if (Array.isArray(incident.rule_ids) && incident.rule_ids.length > 0) {
    const sorted = [...incident.rule_ids]
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);
    if (sorted.length > 0) {
      return {
        groupKey: `Rule IDs: ${sorted.join(', ')}`,
        strategy: 'rule_ids',
      };
    }
  }

  const severity = getSeverityLabel(incident.severity);
  return {
    groupKey: `Severity Cluster: ${severity.toUpperCase()}`,
    strategy: 'severity',
  };
}

function deriveIncidentMetrics(
  data: ReportData,
  dateRange: ReportMetrics['dateRange'],
): ReportIncidentMetrics {
  const rangeStart = parseDate(dateRange.startIso);
  const rangeEnd = parseDate(dateRange.endIso);
  const incidentRows = data.detectionIncidents ?? [];

  const deduped = new Map<string, DetectionIncidentApiRow>();
  for (const incident of incidentRows) {
    const incidentKey = normalizeText(incident.incident_key) || normalizeText(incident.id);
    if (!incidentKey) {
      continue;
    }

    const incidentStart = parseDate(incident.first_seen);
    const incidentEnd = parseDate(incident.last_seen);
    const incidentUpdated = parseDate(incident.updated_at);

    // Incidents are sourced from the local ot_threat_incidents demo model without date filtering in this UI path.
    // We normalize to in-period incidents by checking first_seen/last_seen overlap with selected window.
    const overlaps = overlapsWindow(
      incidentStart ?? incidentUpdated,
      incidentEnd ?? incidentUpdated,
      rangeStart,
      rangeEnd,
    );

    if (!overlaps) {
      continue;
    }

    const existing = deduped.get(incidentKey);
    if (!existing) {
      deduped.set(incidentKey, incident);
      continue;
    }

    const existingUpdatedAt = parseDate(existing.updated_at)?.getTime() ?? 0;
    const currentUpdatedAt = parseDate(incident.updated_at)?.getTime() ?? 0;
    if (currentUpdatedAt >= existingUpdatedAt) {
      deduped.set(incidentKey, incident);
    }
  }

  const incidentsInPeriod = Array.from(deduped.values());
  const totalIncidentCount = incidentsInPeriod.length;
  const openIncidentCount = incidentsInPeriod.filter((incident) => incident.status === 'open').length;
  const acknowledgedIncidentCount = incidentsInPeriod.filter((incident) => incident.status === 'ack').length;
  const closedIncidentCount = incidentsInPeriod.filter((incident) => incident.status === 'closed').length;

  const groupMap = new Map<string, ReportIncidentGroupRow>();
  const strategyUsage: Record<IncidentGroupStrategy, number> = {
    category: 0,
    title: 0,
    rule_ids: 0,
    severity: 0,
  };

  for (const incident of incidentsInPeriod) {
    const { groupKey, strategy } = resolveIncidentGroupKey(incident);
    strategyUsage[strategy] += 1;
    const severity = getSeverityLabel(incident.severity);
    const existing = groupMap.get(groupKey);

    if (!existing) {
      groupMap.set(groupKey, {
        groupKey,
        incidentCount: 1,
        openIncidentCount: incident.status === 'open' ? 1 : 0,
        eventCount: safeNumber(incident.event_count),
        maxSeverity: severity,
        maxRiskScore: safeNumber(incident.max_risk_score),
      });
      continue;
    }

    existing.incidentCount += 1;
    existing.openIncidentCount += incident.status === 'open' ? 1 : 0;
    existing.eventCount += safeNumber(incident.event_count);
    existing.maxSeverity = maxSeverity(existing.maxSeverity, severity);
    existing.maxRiskScore = Math.max(existing.maxRiskScore, safeNumber(incident.max_risk_score));
  }

  const topIncidentGroups = Array.from(groupMap.values())
    .sort((left, right) => {
      if (right.incidentCount !== left.incidentCount) {
        return right.incidentCount - left.incidentCount;
      }

      if (right.eventCount !== left.eventCount) {
        return right.eventCount - left.eventCount;
      }

      return right.maxRiskScore - left.maxRiskScore;
    })
    .slice(0, INCIDENT_MAX_GROUPS);

  const groupingStrategy = strategyUsage.category > 0
    ? 'Grouped by incident category/type when present; fallback to title, rule IDs, then severity cluster.'
    : strategyUsage.title > 0
      ? 'Grouped by incident title; fallback to rule IDs, then severity cluster when title is unavailable.'
      : strategyUsage.rule_ids > 0
        ? 'Grouped by originating rule IDs; fallback to severity cluster when title/category is unavailable.'
        : 'Grouped by severity cluster because category, title, and rule metadata were unavailable.';

  return {
    totalIncidentCount,
    openIncidentCount,
    acknowledgedIncidentCount,
    closedIncidentCount,
    topIncidentGroups,
    incidentsInPeriod,
    groupingStrategy,
  };
}

function buildDetectionFeasibilityRows(
  otAssets: ReportOtAssetMetrics,
  devices: ReportDeviceMetrics,
  communication: ReportCommunicationMetrics,
  risk: ReportRiskMetrics,
  incidents: ReportIncidentMetrics,
  detection: Pick<ReportDetectionMetrics, 'totalRuleCount' | 'defaultRuleCount' | 'customRuleCount'>,
): DetectionFeasibilityRow[] {
  const rows: DetectionFeasibilityRow[] = [];

  rows.push({
    detectionType: 'Asset Inventory Drift',
    feasibility: otAssets.otAssetCount > 0 ? 'High' : 'Low',
    evidenceBasis: `${formatCount(otAssets.otAssetCount)} OT unit_id assets and ${formatCount(devices.observedAssets)} observed IP assets were visible in the selected period.`,
    limitationNote: otAssets.otAssetCount > 0
      ? 'Coverage is limited to OT units currently visible from passive telemetry collection points.'
      : 'No OT unit_id evidence was available for inventory drift checks.',
  });

  rows.push({
    detectionType: 'Unexpected Communication Paths',
    feasibility: communication.communicationPaths > 0 ? 'High' : 'Low',
    evidenceBasis: `${formatCount(communication.communicationPaths)} source-destination paths were analyzed during the selected period.`,
    limitationNote: communication.communicationPaths > 0
      ? 'Path analysis cannot include segments outside monitored traffic visibility.'
      : 'No communication path evidence was available for path anomaly analysis.',
  });

  rows.push({
    detectionType: 'Unknown Client Activity',
    feasibility: communication.unknownClientEvents > 0 || communication.communicationPaths > 0 ? 'High' : 'Low',
    evidenceBasis: `${formatCount(communication.unknownClientEvents)} unknown-client flow event signals were observed.`,
    limitationNote: 'Unknown-client logic depends on mapping completeness and upstream identity context.',
  });

  rows.push({
    detectionType: 'Incident Correlation And Prioritization',
    feasibility: incidents.totalIncidentCount > 0 ? 'High' : risk.totalSecurityEvents > 0 ? 'Partial' : 'Low',
    evidenceBasis: `${formatCount(incidents.totalIncidentCount)} detection incident ${pluralize(incidents.totalIncidentCount, 'record was', 'records were')} visible in-period.`,
    limitationNote: incidents.totalIncidentCount > 0
      ? 'Incident coverage reflects current detection-engine aggregation behavior.'
      : 'No in-period incidents were available for incident-priority validation.',
  });

  rows.push({
    detectionType: 'Rule Coverage Tuning',
    feasibility: detection.totalRuleCount > 0 ? 'Partial' : 'Low',
    evidenceBasis: `${formatCount(detection.defaultRuleCount)} default and ${formatCount(detection.customRuleCount)} custom rules were in scope for this report.`,
    limitationNote: detection.totalRuleCount > 0
      ? 'Rule effectiveness still depends on monitored protocol depth and telemetry completeness.'
      : 'No rule metadata was available in the report data flow.',
  });

  rows.push({
    detectionType: 'Command Source Attribution',
    feasibility: 'Low',
    evidenceBasis: 'Current passive flow and event telemetry does not provide definitive command-origin attribution.',
    limitationNote: KNOWN_LIMITATIONS.find((item) => item.area === 'Command Source Attribution')?.description
      ?? 'Current monitoring path cannot confirm command source attribution.',
  });

  return rows;
}

function deriveDetectionMetrics(
  data: ReportData,
  _dateRange: ReportMetrics['dateRange'],
  otAssets: ReportOtAssetMetrics,
  devices: ReportDeviceMetrics,
  communication: ReportCommunicationMetrics,
  risk: ReportRiskMetrics,
  incidents: ReportIncidentMetrics,
): ReportDetectionMetrics {
  const allRules = data.detectionRules ?? [];

  // Business rule for this report:
  // - Default rules are a fixed platform baseline of 12.
  // - Custom rules are counted directly from detection_rules table rows.
  const customRuleCount = allRules.length;
  const defaultRuleCount = PLATFORM_DEFAULT_RULE_COUNT;
  const totalRuleCount = defaultRuleCount + customRuleCount;
  const activeRuleCount = allRules.filter((rule) => rule.is_active).length;
  const inactiveRuleCount = allRules.filter((rule) => !rule.is_active).length;

  const signals = {
    unknownClient: communication.unknownClientEvents,
    outsideHours: communication.outsideHoursEvents,
    likelyAttack: risk.likelyAttackEvents,
    modbusDisrupted: communication.modbusDisruptedEvents,
    externalOrigin: risk.externalOriginEvents,
  };

  const signalCategoryCount = Object.values(signals).filter((value) => value > 0).length;

  const baseRuleContext = {
    totalRuleCount,
    defaultRuleCount,
    customRuleCount,
  };

  const feasibilityRows = buildDetectionFeasibilityRows(
    otAssets,
    devices,
    communication,
    risk,
    incidents,
    baseRuleContext,
  );

  const highFeasibilityCount = feasibilityRows.filter((row) => row.feasibility === 'High').length;
  const partialFeasibilityCount = feasibilityRows.filter((row) => row.feasibility === 'Partial').length;
  const lowFeasibilityCount = feasibilityRows.filter((row) => row.feasibility === 'Low').length;

  let readiness: ReportDetectionMetrics['readiness'] = 'Moderate';
  if (highFeasibilityCount >= 4 && lowFeasibilityCount <= 1 && totalRuleCount > 0) {
    readiness = 'Strong';
  } else if (lowFeasibilityCount >= 3 || totalRuleCount === 0) {
    readiness = 'Limited';
  }

  return {
    totalRuleCount,
    defaultRuleCount,
    customRuleCount,
    activeRuleCount,
    inactiveRuleCount,
    rulesConsideredForPeriod: customRuleCount,
    signals,
    signalCategoryCount,
    highFeasibilityCount,
    partialFeasibilityCount,
    lowFeasibilityCount,
    readiness,
    feasibilityRows,
  };
}

function deriveCoverageMetrics(
  otAssets: ReportOtAssetMetrics,
  devices: ReportDeviceMetrics,
  communication: ReportCommunicationMetrics,
  risk: ReportRiskMetrics,
  incidents: ReportIncidentMetrics,
  detection: ReportDetectionMetrics,
): ReportCoverageMetrics {
  let monitoringCoverageStatus: ReportCoverageMetrics['monitoringCoverageStatus'] = 'Limited';
  if (otAssets.otAssetCount > 0 && otAssets.staleOrMissingUnitCount === 0) {
    monitoringCoverageStatus = 'Strong';
  } else if (
    otAssets.otAssetCount > 0
    && otAssets.staleOrMissingUnitCount <= Math.ceil(otAssets.otAssetCount / 3)
  ) {
    monitoringCoverageStatus = 'Partial';
  }

  const visibilityGaps: string[] = [];
  if (devices.unknownDevices > 0) {
    visibilityGaps.push(`${formatCount(devices.unknownDevices)} observed IP devices remain unmapped.`);
  }
  if (otAssets.staleOrMissingUnitCount > 0) {
    visibilityGaps.push(`${formatCount(otAssets.staleOrMissingUnitCount)} OT unit assets were stale/missing/offline.`);
  }
  if (communication.unknownDirectionPaths > 0) {
    visibilityGaps.push(`${formatCount(communication.unknownDirectionPaths)} communication paths lacked clear direction labeling.`);
  }
  if (detection.lowFeasibilityCount > 0) {
    visibilityGaps.push(`${formatCount(detection.lowFeasibilityCount)} detection objectives remained low-feasibility in current coverage.`);
  }
  if (incidents.openIncidentCount > 0) {
    visibilityGaps.push(`${formatCount(incidents.openIncidentCount)} incidents remained open at report generation time.`);
  }

  const monitoringCoverageSummary = monitoringCoverageStatus === 'Strong'
    ? `Monitoring coverage was strong: ${formatCount(otAssets.reportingUnitCount)} OT units were observed with no stale/missing/offline unit status.`
    : monitoringCoverageStatus === 'Partial'
      ? `Monitoring coverage was partial: ${formatCount(otAssets.reportingUnitCount)} OT units reported with ${formatCount(otAssets.staleOrMissingUnitCount)} stale/missing/offline unit statuses.`
      : `Monitoring coverage was limited for this period due to low telemetry depth or stale data continuity.`;

  const visibilityGapSummary = visibilityGaps.length > 0
    ? visibilityGaps.slice(0, 2).join(' ')
    : 'No major visibility gap was surfaced from current report-local checks.';

  let productionReadiness: ReportCoverageMetrics['productionReadiness'] = 'Conditional';
  if (
    risk.riskPosture === 'High'
    || monitoringCoverageStatus === 'Limited'
    || detection.readiness === 'Limited'
    || incidents.openIncidentCount > 0
  ) {
    productionReadiness = 'Not Ready';
  } else if (
    risk.riskPosture === 'Low'
    && monitoringCoverageStatus === 'Strong'
    && detection.readiness === 'Strong'
    && incidents.openIncidentCount === 0
  ) {
    productionReadiness = 'Ready';
  }

  return {
    monitoringCoverageStatus,
    monitoringCoverageSummary,
    visibilityGapSummary,
    visibilityGaps,
    productionReadiness,
  };
}

function deriveNarratives(
  data: ReportData,
  dateRange: ReportMetrics['dateRange'],
  otAssets: ReportOtAssetMetrics,
  devices: ReportDeviceMetrics,
  communication: ReportCommunicationMetrics,
  risk: ReportRiskMetrics,
  incidents: ReportIncidentMetrics,
  detection: ReportDetectionMetrics,
  _coverage: ReportCoverageMetrics,
): ReportNarrativeSummary {
  const topProtocol = communication.protocolBreakdown[0]?.protocol ?? 'No protocol';

  const executiveSummary = [
    `During ${dateRange.periodLabel}, passive OT telemetry showed ${formatCount(otAssets.otAssetCount)} OT unit assets and ${formatCount(communication.communicationPaths)} communication paths.`,
    `Security exposure in this period included ${formatCount(risk.totalSecurityEvents)} security events and ${formatCount(incidents.totalIncidentCount)} detection incidents, resulting in a ${risk.riskPosture.toLowerCase()} observed risk posture.`,
    'Findings reflect currently visible telemetry only and should not be interpreted as full OT asset or threat coverage.',
  ].join(' ');

  const environmentOverview = [
    `This report covers ${data.config.clientName} for ${dateRange.periodLabel} using passive OT telemetry and detection-engine outputs.`,
    `Observed communication was led by ${topProtocol}, with ${formatCount(communication.flowEvents)} flow events across visible paths.`,
    'Confidence depends on current collection coverage and OT unit reporting continuity.',
  ].join(' ');

  const assetVisibility = [
    `${formatCount(otAssets.otAssetCount)} OT unit_id assets were observed from SmartLogger-side telemetry in this period.`,
    `${formatCount(devices.knownDevices)} active mapped IP devices were in registry, while ${formatCount(devices.unknownDevices)} observed IP devices remained unmapped.`,
    'OT asset visibility remains bounded by current passive telemetry coverage and downstream monitoring depth.',
  ].join(' ');

  const communicationNarrative = [
    `${formatCount(communication.communicationPaths)} communication paths were observed with ${formatCount(communication.unknownDirectionPaths)} direction-unclear paths requiring validation.`,
    `Unit-level control evidence covered ${formatCount(communication.otUnitParticipationCount)} OT units, with ${formatCount(communication.otUnitsWithErrors)} units showing polling errors and ${formatCount(communication.otUnitsWithSlowPolls)} units showing slow polls.`,
    `Control reliability was ${communication.modbusSuccessRate}% based on ${formatCount(communication.modbusRequests)} Modbus requests with ${formatCount(communication.modbusErrors)} errors.`,
    `${formatCount(communication.highRiskFlows)} high-risk flows (max risk score >= ${HIGH_RISK_FLOW_THRESHOLD}) were identified for follow-up review.`,
  ].join(' ');

  const riskNarrative = [
    `Observed risk posture for this period is ${risk.riskPosture.toLowerCase()} based on ${formatCount(risk.totalSecurityEvents)} security events, ${formatCount(risk.highSeverityEvents)} high/critical events, and ${formatCount(incidents.totalIncidentCount)} detection incidents.`,
    `${formatCount(risk.riskSources)} source IPs appeared in high-risk flows, and ${formatCount(risk.likelyAttackEvents)} likely-attack events were recorded.`,
    'These indicators represent observed telemetry evidence and should be treated as exposure signals, not confirmed compromise.',
  ].join(' ');

  const detectionNarrative = [
    `${formatCount(detection.defaultRuleCount)} platform default rules and ${formatCount(detection.customRuleCount)} custom rules from detection_rules were considered for this report.`,
    `${formatCount(detection.signalCategoryCount)} detection signal categories were observed, with feasibility split into ${formatCount(detection.highFeasibilityCount)} high, ${formatCount(detection.partialFeasibilityCount)} partial, and ${formatCount(detection.lowFeasibilityCount)} low objectives.`,
    'Readiness remains constrained by passive visibility depth and command-source attribution limits.',
  ].join(' ');

  const riskAssessmentReport = [
    `For ${dateRange.periodLabel}, the environment showed useful OT visibility and active communication evidence, but key weakness patterns remained in identity confidence, boundary exposure, and monitoring depth.`,
    `Unmapped devices (${formatCount(devices.unknownDevices)}), external-origin activity (${formatCount(risk.externalOriginEvents)} events), and open incidents (${formatCount(incidents.openIncidentCount)}) indicate exposure that can delay attribution and increase operational security uncertainty if not addressed.`,
    'Priority should focus on improving mapping completeness, tightening external exposure controls, and closing incident follow-up gaps first.',
  ].join(' ');

  const conclusion = [
    `In ${dateRange.periodLabel}, the report identified ${formatCount(otAssets.otAssetCount)} OT assets, ${formatCount(communication.communicationPaths)} communication paths, and a ${risk.riskPosture.toLowerCase()} observed risk posture based on event, incident, and control evidence.`,
    `The main findings were ${formatCount(devices.unknownDevices)} unmapped observed devices, ${formatCount(risk.externalOriginEvents)} external-origin security events, ${formatCount(incidents.totalIncidentCount)} incidents (${formatCount(incidents.openIncidentCount)} open), and ${communication.modbusSuccessRate}% control-path success.`,
    `Detection readiness was ${detection.readiness.toLowerCase()}, and the clearest next focus is to improve mapping confidence, incident closure, and monitoring depth in areas where visibility remains partial.`,
  ].join(' ');

  return {
    executiveSummary,
    environmentOverview,
    assetVisibility,
    communication: communicationNarrative,
    risk: riskNarrative,
    detection: detectionNarrative,
    riskAssessmentReport,
    conclusion,
  };
}

function buildAiEvidencePack(
  data: ReportData,
  metrics: Omit<ReportMetrics, 'aiEvidence'>,
): ReportAiEvidencePack {
  const mappedDeviceExamples = (data.deviceMappings ?? [])
    .filter((mapping) => (
      mapping.mapping_type === 'ip'
      && mapping.is_active
      && normalizeIpForDisplay(mapping.ip_address)
      && normalizeText(mapping.display_name).length > 0
    ))
    .slice(0, 5)
    .map((mapping) => ({
      ip: normalizeIpForDisplay(mapping.ip_address) ?? 'Unknown',
      name: normalizeText(mapping.display_name),
    }));

  return {
    reportingWindow: {
      startIso: metrics.dateRange.startIso,
      endIso: metrics.dateRange.endIso,
      periodLabel: metrics.dateRange.periodLabel,
    },
    reportContext: {
      site: data.config.clientName,
      reportType: data.config.type,
    },
    otAssetVisibility: {
      otAssetCount: metrics.otAssets.otAssetCount,
      reportingUnitCount: metrics.otAssets.reportingUnitCount,
      staleOrMissingUnitCount: metrics.otAssets.staleOrMissingUnitCount,
      otAssetExamples: metrics.otAssets.otAssets.slice(0, 8).map((row) => ({
        unitId: row.unitId,
        assetName: row.assetName,
        health: row.health,
        freshnessMinutes: row.freshnessMinutes,
      })),
      summary: metrics.otAssets.summary,
    },
    deviceVisibility: {
      knownDevices: metrics.devices.knownDevices,
      unknownDevices: metrics.devices.unknownDevices,
      observedAssets: metrics.devices.observedAssets,
      observedMappedDevices: metrics.devices.observedMappedDevices,
      mappingCoveragePercent: metrics.devices.mappingCoveragePercent,
      mappedDeviceExamples,
    },
    communicationVisibility: {
      communicationPaths: metrics.communication.communicationPaths,
      flowEvents: metrics.communication.flowEvents,
      internalPaths: metrics.communication.internalPaths,
      externalPaths: metrics.communication.externalPaths,
      unknownDirectionPaths: metrics.communication.unknownDirectionPaths,
      otUnitParticipationCount: metrics.communication.otUnitParticipationCount,
      otUnitsWithErrors: metrics.communication.otUnitsWithErrors,
      otUnitsWithSlowPolls: metrics.communication.otUnitsWithSlowPolls,
      topOtControlUnits: metrics.communication.topOtControlUnits.slice(0, AI_PATH_EXAMPLES).map((row) => ({
        unitId: row.unitId,
        unitLabel: row.unitLabel,
        totalRequests: row.totalRequests,
        successRate: row.successRate,
        errorCount: row.errorCount,
        slowCount: row.slowCount,
        avgResponseTimeMs: row.avgResponseTimeMs,
      })),
      topProtocols: metrics.communication.protocolBreakdown.slice(0, AI_PROTOCOL_EXAMPLES),
      notablePaths: metrics.communication.notablePaths.slice(0, AI_PATH_EXAMPLES).map((row) => ({
        sourceIp: row.sourceIp,
        destinationIp: row.destinationIp,
        protocol: row.protocol,
        direction: row.direction,
        eventCount: row.eventCount,
        maxRiskScore: row.maxRiskScore,
        unknownClientFlowEvents: row.unknownClientEvents,
      })),
    },
    riskEvidence: {
      securityEvents: metrics.risk.totalSecurityEvents,
      highSeverityEvents: metrics.risk.highSeverityEvents,
      likelyAttackEvents: metrics.risk.likelyAttackEvents,
      unknownClientSecurityEvents: metrics.risk.unknownClientEvents,
      externalOriginEvents: metrics.risk.externalOriginEvents,
      highRiskFlows: metrics.communication.highRiskFlows,
      highRiskFlowEvents: metrics.communication.highRiskFlowEvents,
      riskSources: metrics.risk.riskSources,
      topRiskSources: metrics.risk.topRiskSources.slice(0, AI_RISK_SOURCE_EXAMPLES),
    },
    incidentEvidence: {
      totalIncidentCount: metrics.incidents.totalIncidentCount,
      openIncidentCount: metrics.incidents.openIncidentCount,
      acknowledgedIncidentCount: metrics.incidents.acknowledgedIncidentCount,
      closedIncidentCount: metrics.incidents.closedIncidentCount,
      groupingStrategy: metrics.incidents.groupingStrategy,
      topIncidentGroups: metrics.incidents.topIncidentGroups.slice(0, AI_INCIDENT_GROUP_EXAMPLES).map((group) => ({
        groupKey: group.groupKey,
        incidentCount: group.incidentCount,
        openIncidentCount: group.openIncidentCount,
        eventCount: group.eventCount,
        maxSeverity: group.maxSeverity,
        maxRiskScore: group.maxRiskScore,
      })),
    },
    detectionEvidence: {
      totalRuleCount: metrics.detection.totalRuleCount,
      defaultRuleCount: metrics.detection.defaultRuleCount,
      customRuleCount: metrics.detection.customRuleCount,
      activeRuleCount: metrics.detection.activeRuleCount,
      inactiveRuleCount: metrics.detection.inactiveRuleCount,
      signalCategoryCount: metrics.detection.signalCategoryCount,
      detectionSignals: metrics.detection.signals,
      feasibilitySummary: {
        high: metrics.detection.highFeasibilityCount,
        partial: metrics.detection.partialFeasibilityCount,
        low: metrics.detection.lowFeasibilityCount,
        readiness: metrics.detection.readiness,
      },
    },
    controlReliability: {
      modbusSuccessRate: metrics.communication.modbusSuccessRate,
      modbusErrors: metrics.communication.modbusErrors,
      modbusSlowPolls: metrics.communication.modbusSlowPolls,
      controlStability: metrics.communication.controlStability,
      summary: metrics.communication.controlReliabilitySummary,
    },
    monitoringCoverage: {
      coverageStatus: metrics.coverage.monitoringCoverageStatus,
      reportingNormally: metrics.devices.reportingNormally,
      limitedTelemetry: metrics.devices.limitedTelemetry,
      staleOrMissing: metrics.devices.staleOrMissing,
      note: 'Monitoring is passive and reflects current collection points only.',
    },
    coverageEvidence: {
      monitoringCoverageSummary: metrics.coverage.monitoringCoverageSummary,
      visibilityGapSummary: metrics.coverage.visibilityGapSummary,
      visibilityGaps: metrics.coverage.visibilityGaps,
      productionReadiness: metrics.coverage.productionReadiness,
    },
    normalizedMetrics: {
      knownDeviceCount: metrics.devices.knownDevices,
      unknownDeviceCount: metrics.devices.unknownDevices,
      otAssetCount: metrics.otAssets.otAssetCount,
      observedIpAssetCount: metrics.devices.observedAssets,
      observedAssetCount: metrics.devices.observedAssets,
      communicationPathCount: metrics.communication.communicationPaths,
      internalPathCount: metrics.communication.internalPaths,
      externalPathCount: metrics.communication.externalPaths,
      unknownDirectionPathCount: metrics.communication.unknownDirectionPaths,
      totalSecurityEventCount: metrics.risk.totalSecurityEvents,
      likelyAttackEventCount: metrics.risk.likelyAttackEvents,
      unknownClientEventCount: metrics.risk.unknownClientEvents,
      externalOriginEventCount: metrics.risk.externalOriginEvents,
      highSeverityEventCount: metrics.risk.highSeverityEvents,
      highRiskFlowCount: metrics.communication.highRiskFlows,
      highRiskFlowEventCount: metrics.communication.highRiskFlowEvents,
      riskSourceCount: metrics.risk.riskSources,
      totalIncidentCount: metrics.incidents.totalIncidentCount,
      defaultRuleCount: metrics.detection.defaultRuleCount,
      customRuleCount: metrics.detection.customRuleCount,
      detectionReadinessSummary: `${metrics.detection.readiness} (${formatCount(metrics.detection.highFeasibilityCount)} high / ${formatCount(metrics.detection.partialFeasibilityCount)} partial / ${formatCount(metrics.detection.lowFeasibilityCount)} low)`,
      detectionFeasibilitySummary: `${formatCount(metrics.detection.highFeasibilityCount)} high, ${formatCount(metrics.detection.partialFeasibilityCount)} partial, ${formatCount(metrics.detection.lowFeasibilityCount)} low`,
      controlReliabilitySummary: metrics.communication.controlReliabilitySummary,
      monitoringCoverageSummary: metrics.coverage.monitoringCoverageSummary,
      visibilityGapSummary: metrics.coverage.visibilityGapSummary,
    },
    limitations: KNOWN_LIMITATIONS.map((item) => `${item.area}: ${item.description}`),
  };
}

export function deriveReportMetrics(data: ReportData): ReportMetrics {
  const dateRange = deriveDateRange(data);
  const mappedIpNameMap = buildMappedIpNameMap(data.deviceMappings);
  // commTopFlows rows are fetched with customStart/customEnd and are already scoped by event_time.
  const observedIps = buildObservedIpSet(data.commTopFlows?.rows);

  const otAssets = deriveOtAssetMetrics(data);
  const devices = deriveDeviceMetrics(data, mappedIpNameMap, observedIps);
  const communication = deriveCommunicationMetrics(data);
  const risk = deriveRiskMetrics(data, communication);
  const incidents = deriveIncidentMetrics(data, dateRange);
  const detection = deriveDetectionMetrics(data, dateRange, otAssets, devices, communication, risk, incidents);
  const coverage = deriveCoverageMetrics(otAssets, devices, communication, risk, incidents, detection);

  const narratives = deriveNarratives(
    data,
    dateRange,
    otAssets,
    devices,
    communication,
    risk,
    incidents,
    detection,
    coverage,
  );

  const baseMetrics = {
    dateRange,
    otAssets,
    devices,
    communication,
    risk,
    incidents,
    detection,
    coverage,
    narratives,
  };

  const aiEvidence = buildAiEvidencePack(data, baseMetrics);

  return {
    ...baseMetrics,
    aiEvidence,
  };
}

export function buildReportAiEvidencePack(
  data: ReportData,
  metrics?: ReportMetrics,
): ReportAiEvidencePack {
  if (metrics) {
    return metrics.aiEvidence;
  }

  return deriveReportMetrics(data).aiEvidence;
}

export function buildSectionAiEvidence(
  sectionId: SectionId,
  evidencePack: ReportAiEvidencePack,
  metrics: ReportMetrics,
): Record<string, unknown> {
  const fallbackRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'info' = metrics.risk.riskPosture === 'High'
    ? 'high'
    : metrics.risk.riskPosture === 'Medium'
      ? 'medium'
      : 'low';

  const fallbackBySection: Record<SectionId, { summary: string; suggestion: string; riskLevel: string }> = {
    cover: {
      summary: '',
      suggestion: '',
      riskLevel: 'info',
    },
    toc: {
      summary: '',
      suggestion: '',
      riskLevel: 'info',
    },
    'executive-summary': {
      summary: metrics.narratives.executiveSummary,
      suggestion: '',
      riskLevel: fallbackRiskLevel,
    },
    'environment-overview': {
      summary: metrics.narratives.environmentOverview,
      suggestion: '',
      riskLevel: 'info',
    },
    'asset-visibility-summary': {
      summary: metrics.narratives.assetVisibility,
      suggestion: '',
      riskLevel: metrics.otAssets.staleOrMissingUnitCount > 0 || metrics.devices.unknownDevices > 0 ? 'medium' : 'low',
    },
    'communication-overview': {
      summary: metrics.narratives.communication,
      suggestion: '',
      riskLevel: metrics.communication.highRiskFlows > 0 || metrics.communication.externalPaths > 0 ? 'medium' : 'low',
    },
    'alerts-and-risk-findings': {
      summary: metrics.narratives.risk,
      suggestion: [
        `Prioritize triage for ${formatCount(metrics.incidents.openIncidentCount)} open incidents and validate ${formatCount(metrics.risk.riskSources)} high-risk source IPs against approved OT behavior.`,
        `Review ${formatCount(metrics.risk.externalOriginEvents)} external-origin events and ${formatCount(metrics.risk.unknownClientEvents)} unknown-client security events for exposure containment.`,
      ].join(' '),
      riskLevel: fallbackRiskLevel,
    },
    'detection-rule-summary': {
      summary: metrics.narratives.detection,
      suggestion: [
        `Tune ${formatCount(metrics.detection.customRuleCount)} custom rules using this period's incidents and communication baselines.`,
        `Improve coverage where feasibility remains low (${formatCount(metrics.detection.lowFeasibilityCount)} objectives).`,
      ].join(' '),
      riskLevel: metrics.detection.readiness === 'Limited' ? 'high' : metrics.detection.readiness === 'Moderate' ? 'medium' : 'low',
    },
    'risk-assessment-report': {
      summary: metrics.narratives.riskAssessmentReport,
      suggestion: [
        `Protection priority 1: close open incidents (${formatCount(metrics.incidents.openIncidentCount)}) and strengthen response discipline.`,
        `Priority 2: complete mapping for unmapped observed devices (${formatCount(metrics.devices.unknownDevices)}).`,
        `Priority 3: tighten external exposure controls (${formatCount(metrics.risk.externalOriginEvents)} external-origin events observed) and improve monitoring depth where confidence remains partial.`,
      ].join(' '),
      riskLevel: fallbackRiskLevel,
    },
    'conclusion-and-next-steps': {
      summary: metrics.narratives.conclusion,
      suggestion: '',
      riskLevel: fallbackRiskLevel,
    },
  };

  const fallback = fallbackBySection[sectionId];

  switch (sectionId) {
    case 'executive-summary':
      return {
        sectionObjective: 'Executive monthly period summary for OT visibility and security posture.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          site: evidencePack.reportContext.site,
          otAssetVisibility: evidencePack.otAssetVisibility,
          deviceVisibility: evidencePack.deviceVisibility,
          communicationVisibility: {
            communicationPaths: evidencePack.communicationVisibility.communicationPaths,
            internalPaths: evidencePack.communicationVisibility.internalPaths,
            externalPaths: evidencePack.communicationVisibility.externalPaths,
            topProtocols: evidencePack.communicationVisibility.topProtocols,
          },
          riskEvidence: {
            securityEvents: evidencePack.riskEvidence.securityEvents,
            highSeverityEvents: evidencePack.riskEvidence.highSeverityEvents,
            likelyAttackEvents: evidencePack.riskEvidence.likelyAttackEvents,
            externalOriginEvents: evidencePack.riskEvidence.externalOriginEvents,
            riskSources: evidencePack.riskEvidence.riskSources,
          },
          incidentEvidence: {
            totalIncidentCount: evidencePack.incidentEvidence.totalIncidentCount,
            openIncidentCount: evidencePack.incidentEvidence.openIncidentCount,
          },
          coverageEvidence: evidencePack.coverageEvidence,
          monitoringCoverage: evidencePack.monitoringCoverage,
        },
        fallback,
      };
    case 'environment-overview':
      return {
        sectionObjective: 'Monitored environment framing and data boundary summary.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          reportContext: evidencePack.reportContext,
          otAssetVisibility: evidencePack.otAssetVisibility,
          communicationVisibility: {
            communicationPaths: evidencePack.communicationVisibility.communicationPaths,
            flowEvents: evidencePack.communicationVisibility.flowEvents,
            internalPaths: evidencePack.communicationVisibility.internalPaths,
            externalPaths: evidencePack.communicationVisibility.externalPaths,
            unknownDirectionPaths: evidencePack.communicationVisibility.unknownDirectionPaths,
            topProtocols: evidencePack.communicationVisibility.topProtocols,
          },
          coverageEvidence: evidencePack.coverageEvidence,
          monitoringCoverage: evidencePack.monitoringCoverage,
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'asset-visibility-summary':
      return {
        sectionObjective: 'OT asset visibility status, mapping confidence, and monitoring continuity summary.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          otAssetVisibility: evidencePack.otAssetVisibility,
          deviceVisibility: evidencePack.deviceVisibility,
          coverageEvidence: evidencePack.coverageEvidence,
          monitoringCoverage: evidencePack.monitoringCoverage,
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'communication-overview':
      return {
        sectionObjective: 'Communication and control path interpretation for the reporting period.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          otAssetVisibility: evidencePack.otAssetVisibility,
          communicationVisibility: evidencePack.communicationVisibility,
          controlReliability: evidencePack.controlReliability,
          coverageEvidence: evidencePack.coverageEvidence,
          riskEvidence: {
            highRiskFlows: evidencePack.riskEvidence.highRiskFlows,
            highRiskFlowEvents: evidencePack.riskEvidence.highRiskFlowEvents,
            unknownClientSecurityEvents: evidencePack.riskEvidence.unknownClientSecurityEvents,
            likelyAttackEvents: evidencePack.riskEvidence.likelyAttackEvents,
          },
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'alerts-and-risk-findings':
      return {
        sectionObjective: 'Grounded risk assessment based on observed security events, communication exposure, and incidents.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          otAssetVisibility: evidencePack.otAssetVisibility,
          riskEvidence: evidencePack.riskEvidence,
          incidentEvidence: evidencePack.incidentEvidence,
          communicationVisibility: {
            externalPaths: evidencePack.communicationVisibility.externalPaths,
            unknownDirectionPaths: evidencePack.communicationVisibility.unknownDirectionPaths,
            notablePaths: evidencePack.communicationVisibility.notablePaths,
          },
          deviceVisibility: {
            unknownDevices: evidencePack.deviceVisibility.unknownDevices,
            mappingCoveragePercent: evidencePack.deviceVisibility.mappingCoveragePercent,
          },
          coverageEvidence: evidencePack.coverageEvidence,
          monitoringCoverage: evidencePack.monitoringCoverage,
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'detection-rule-summary':
      return {
        sectionObjective: 'Detection readiness summary using rule inventory, incident outcomes, and signal feasibility evidence.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          detectionEvidence: evidencePack.detectionEvidence,
          incidentEvidence: {
            totalIncidentCount: evidencePack.incidentEvidence.totalIncidentCount,
            openIncidentCount: evidencePack.incidentEvidence.openIncidentCount,
            topIncidentGroups: evidencePack.incidentEvidence.topIncidentGroups,
          },
          riskEvidence: {
            likelyAttackEvents: evidencePack.riskEvidence.likelyAttackEvents,
            unknownClientSecurityEvents: evidencePack.riskEvidence.unknownClientSecurityEvents,
          },
          coverageEvidence: evidencePack.coverageEvidence,
          controlReliability: evidencePack.controlReliability,
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'risk-assessment-report':
      return {
        sectionObjective: 'Decision-maker risk assessment: explain current weaknesses, why they matter, what they could lead to, and where visibility is limited.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          riskOverview: {
            riskPosture: metrics.risk.riskPosture,
            securityEvents: evidencePack.riskEvidence.securityEvents,
            highSeverityEvents: evidencePack.riskEvidence.highSeverityEvents,
            likelyAttackEvents: evidencePack.riskEvidence.likelyAttackEvents,
            highRiskFlows: evidencePack.riskEvidence.highRiskFlows,
            externalOriginEvents: evidencePack.riskEvidence.externalOriginEvents,
            totalIncidentCount: evidencePack.incidentEvidence.totalIncidentCount,
            openIncidentCount: evidencePack.incidentEvidence.openIncidentCount,
          },
          weaknessSignals: {
            otAssetCount: evidencePack.otAssetVisibility.otAssetCount,
            staleOrMissingUnits: evidencePack.otAssetVisibility.staleOrMissingUnitCount,
            knownDevices: evidencePack.deviceVisibility.knownDevices,
            unknownDevices: evidencePack.deviceVisibility.unknownDevices,
            mappingCoveragePercent: evidencePack.deviceVisibility.mappingCoveragePercent,
            unknownDirectionPaths: evidencePack.communicationVisibility.unknownDirectionPaths,
            monitoringCoverageStatus: evidencePack.monitoringCoverage.coverageStatus,
            detectionLowFeasibilityCount: evidencePack.detectionEvidence.feasibilitySummary.low,
          },
          coverageEvidence: evidencePack.coverageEvidence,
          controlReliability: {
            controlStability: evidencePack.controlReliability.controlStability,
            modbusSuccessRate: evidencePack.controlReliability.modbusSuccessRate,
            summary: evidencePack.controlReliability.summary,
          },
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    case 'conclusion-and-next-steps':
      return {
        sectionObjective: 'Monthly conclusion grounded in observed period evidence and current monitoring boundaries.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          reportContext: evidencePack.reportContext,
          otAssetVisibility: evidencePack.otAssetVisibility,
          deviceVisibility: {
            knownDevices: evidencePack.deviceVisibility.knownDevices,
            unknownDevices: evidencePack.deviceVisibility.unknownDevices,
            mappingCoveragePercent: evidencePack.deviceVisibility.mappingCoveragePercent,
          },
          riskEvidence: evidencePack.riskEvidence,
          incidentEvidence: evidencePack.incidentEvidence,
          detectionEvidence: evidencePack.detectionEvidence,
          coverageEvidence: evidencePack.coverageEvidence,
          controlReliability: evidencePack.controlReliability,
          monitoringCoverage: evidencePack.monitoringCoverage,
          limitations: evidencePack.limitations,
        },
        fallback,
      };
    default:
      return {
        sectionObjective: 'Supplemental report section evidence.',
        evidence: {
          reportingWindow: evidencePack.reportingWindow,
          reportContext: evidencePack.reportContext,
        },
        fallback,
      };
  }
}

export function formatReportBucket(isoValue: string): string {
  const parsed = parseDate(isoValue);
  if (!parsed) {
    return isoValue;
  }

  return format(parsed, 'dd MMM HH:mm');
}

export function getCoverageValue(
  items: PowerMonitoringTelemetryCoverageApiItem[] | undefined,
  key: PowerMonitoringTelemetryCoverageApiItem['coverage_key'],
): number {
  return items?.find((item) => item.coverage_key === key)?.value ?? 0;
}

export function getTotalSecurityEvents(data: ReportData): number {
  return deriveReportMetrics(data).risk.totalSecurityEvents;
}

export function getHighRiskSourceCount(data: ReportData): number {
  return deriveReportMetrics(data).risk.riskSources;
}

export function getKnownMappedAssetCount(data: ReportData): number {
  return deriveReportMetrics(data).devices.knownDevices;
}

export function getUnknownDeviceCount(data: ReportData): number {
  return deriveReportMetrics(data).devices.unknownDevices;
}

export function getMappingCompletionPercent(data: ReportData): number {
  return deriveReportMetrics(data).devices.mappingCoveragePercent;
}

export function getProtocolDistribution(data: ReportData): Array<{ name: string; value: number }> {
  return deriveReportMetrics(data).communication.protocolBreakdown.map((item) => ({
    name: item.protocol,
    value: item.events,
  }));
}

export function getDominantParticipant(data: ReportData): string {
  return deriveReportMetrics(data).communication.primaryParticipant;
}

export function deriveReportRisks(data: ReportData): RiskItem[] {
  const metrics = deriveReportMetrics(data);
  const risks: RiskItem[] = [];

  if (metrics.risk.riskSources > 0) {
    risks.push({
      id: 'risk-high-risk-sources',
      title: `${formatCount(metrics.risk.riskSources)} high-risk source ${pluralize(metrics.risk.riskSources, 'IP')}`,
      description: 'One or more source IPs generated communication flows with max risk score >= 70.',
      severity: metrics.risk.riskPosture === 'High' ? 'high' : 'medium',
      recommendation: 'Validate source ownership and review each high-risk communication flow against expected OT behavior.',
      category: 'Security Exposure',
    });
  }

  if (metrics.incidents.totalIncidentCount > 0) {
    risks.push({
      id: 'risk-detection-incidents',
      title: `${formatCount(metrics.incidents.totalIncidentCount)} detection ${pluralize(metrics.incidents.totalIncidentCount, 'incident')}`,
      description: 'Detection engine incidents were recorded for the selected period and require context-aware triage.',
      severity: metrics.incidents.openIncidentCount > 0 ? 'high' : 'medium',
      recommendation: 'Review open incidents first, then validate whether grouped incident patterns match approved OT operations.',
      category: 'Incident Management',
    });
  }

  if (metrics.otAssets.staleOrMissingUnitCount > 0) {
    risks.push({
      id: 'risk-stale-or-missing-telemetry',
      title: `${formatCount(metrics.otAssets.staleOrMissingUnitCount)} OT units reported stale/missing/offline status`,
      description: 'SmartLogger-linked OT unit health indicated stale, missing, or offline unit status during the selected period.',
      severity: metrics.otAssets.staleOrMissingUnitCount > 2 ? 'high' : 'medium',
      recommendation: 'Recover OT unit reporting continuity before treating visibility findings as operationally complete.',
      category: 'Visibility',
    });
  }

  if (metrics.communication.modbusErrors > 0) {
    risks.push({
      id: 'risk-modbus-errors',
      title: `${formatCount(metrics.communication.modbusErrors)} Modbus error ${pluralize(metrics.communication.modbusErrors, 'event')}`,
      description: 'Control-path errors were observed in Modbus request/response telemetry.',
      severity: toneByThreshold(metrics.communication.modbusErrors, 0, 20) === 'danger' ? 'high' : 'medium',
      recommendation: 'Review affected units and communication timing to stabilize control reliability.',
      category: 'Control Reliability',
    });
  }

  return risks;
}

export function deriveVisibilityCoverageRows(data: ReportData): VisibilityCoverageRow[] {
  const metrics = deriveReportMetrics(data);

  return [
    {
      item: 'Observed Communication Assets',
      status: metrics.devices.observedAssets > 0 ? 'Observed' : 'Not Observed',
      confidence: metrics.devices.observedAssets > 0 ? 'Medium' : 'Low',
      explanation: `${formatCount(metrics.devices.observedAssets)} distinct communication-observed IP assets were visible in the selected period.`,
    },
    {
      item: 'Device Mapping Coverage',
      status: `${metrics.devices.mappingCoveragePercent}%`,
      confidence: metrics.devices.mappingCoveragePercent >= 80 ? 'High' : metrics.devices.mappingCoveragePercent >= 50 ? 'Medium' : 'Low',
      explanation: `${formatCount(metrics.devices.observedMappedDevices)} observed assets matched active mappings; ${formatCount(metrics.devices.unknownDevices)} remained unmapped.`,
    },
    {
      item: 'OT Unit Coverage',
      status: metrics.otAssets.staleOrMissingUnitCount === 0 ? 'Good' : 'Partial',
      confidence: metrics.otAssets.staleOrMissingUnitCount === 0 ? 'High' : 'Medium',
      explanation: `${formatCount(metrics.otAssets.otAssetCount)} OT units observed; ${formatCount(metrics.otAssets.staleOrMissingUnitCount)} stale/missing/offline by latest health status.`,
    },
    {
      item: 'Communication Path Evidence',
      status: metrics.communication.communicationPaths > 0 ? 'Observed' : 'Not Observed',
      confidence: metrics.communication.communicationPaths > 0 ? 'High' : 'Low',
      explanation: `${formatCount(metrics.communication.communicationPaths)} unique communication paths were available for analysis.`,
    },
  ];
}

export function deriveDetectionFeasibilityRows(data: ReportData): DetectionFeasibilityRow[] {
  return deriveReportMetrics(data).detection.feasibilityRows;
}

function splitSeries<T>(items: T[]): [T[], T[]] {
  if (items.length === 0) {
    return [[], []];
  }

  const middle = Math.max(1, Math.floor(items.length / 2));
  return [items.slice(0, middle), items.slice(middle)];
}

function formatDelta(previous: number, current: number, suffix = ''): string {
  if (previous === 0 && current === 0) {
    return 'No change';
  }

  if (previous === 0) {
    return `+${current.toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }

  const changePercent = ((current - previous) / previous) * 100;
  const sign = changePercent > 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(0)}%`;
}

export function deriveTrendComparisonRows(data: ReportData): TrendComparisonRow[] {
  const comparisons: TrendComparisonRow[] = [];

  const [previousEvents, currentEvents] = splitSeries(data.securityEventsOverTime?.rows ?? []);
  if (previousEvents.length > 0 || currentEvents.length > 0) {
    const sum = (rows: OtSecurityExposureEventsOverTimeApiRow[]) => rows.reduce(
      (total, row) => total + safeNumber(row.low) + safeNumber(row.medium) + safeNumber(row.high) + safeNumber(row.critical),
      0,
    );

    const previous = sum(previousEvents);
    const current = sum(currentEvents);
    comparisons.push({
      metric: 'Security Events',
      previous: String(previous),
      current: String(current),
      change: formatDelta(previous, current),
    });
  }

  const [previousModbus, currentModbus] = splitSeries(data.modbusRequestsErrors?.points ?? []);
  if (previousModbus.length > 0 || currentModbus.length > 0) {
    const errorRate = (points: OtCommunicationModbusRequestsErrorsApiPoint[]) => {
      const requests = points.reduce((sum, point) => sum + safeNumber(point.total_requests), 0);
      const errors = points.reduce((sum, point) => sum + safeNumber(point.total_errors), 0);
      return requests > 0 ? (errors / requests) * 100 : 0;
    };

    const previous = errorRate(previousModbus);
    const current = errorRate(currentModbus);
    comparisons.push({
      metric: 'Modbus Error Rate',
      previous: `${previous.toFixed(1)}%`,
      current: `${current.toFixed(1)}%`,
      change: formatDelta(previous, current),
    });
  }

  return comparisons;
}

export function deriveRecommendationGroups(data: ReportData): ActionGroup[] {
  const metrics = deriveReportMetrics(data);

  const immediate: string[] = [];
  if (metrics.incidents.openIncidentCount > 0) {
    immediate.push(`Triage ${formatCount(metrics.incidents.openIncidentCount)} open detection ${pluralize(metrics.incidents.openIncidentCount, 'incident')} from the selected period.`);
  }
  if (metrics.risk.likelyAttackEvents > 0) {
    immediate.push(`Investigate ${formatCount(metrics.risk.likelyAttackEvents)} likely-attack verdict events for validated OT impact.`);
  }

  const shortTerm: string[] = [];
  if (metrics.devices.unknownDevices > 0) {
    shortTerm.push(`Map ${formatCount(metrics.devices.unknownDevices)} unknown observed device IPs to improve attribution confidence.`);
  }
  if (metrics.detection.customRuleCount > 0) {
    shortTerm.push(`Tune ${formatCount(metrics.detection.customRuleCount)} custom detection ${pluralize(metrics.detection.customRuleCount, 'rule')} using this period's incident and flow patterns.`);
  }
  if (metrics.otAssets.staleOrMissingUnitCount > 0) {
    shortTerm.push(`Recover reporting continuity for ${formatCount(metrics.otAssets.staleOrMissingUnitCount)} stale/missing/offline OT units.`);
  }

  const architecture = KNOWN_LIMITATIONS.slice(0, 3).map((item) => `${item.area}: ${item.mitigation}`);

  return [
    {
      title: 'Immediate Actions',
      tone: 'immediate',
      items: immediate.length > 0
        ? immediate
        : ['No immediate containment action was triggered by current period telemetry.'],
    },
    {
      title: 'Short-Term Improvements',
      tone: 'short-term',
      items: shortTerm.length > 0
        ? shortTerm
        : ['Maintain current monitoring cadence and compare these metrics month-to-month.'],
    },
    {
      title: 'Architecture / Visibility Improvements',
      tone: 'architecture',
      items: architecture,
    },
  ];
}

export function buildDetectionReadinessInput(
  data: ReportData,
  startDate: string,
  endDate: string,
) {
  const metrics = deriveReportMetrics(data);

  return {
    report_start: startDate,
    report_end: endDate,
    high_feasibility_count: metrics.detection.highFeasibilityCount,
    partial_feasibility_count: metrics.detection.partialFeasibilityCount,
    low_feasibility_count: metrics.detection.lowFeasibilityCount,
    observed_detection_signal_count: metrics.detection.signalCategoryCount,
    observed_assets: metrics.otAssets.otAssetCount,
    observed_paths: metrics.communication.communicationPaths,
    high_risk_source_count: metrics.risk.riskSources,
    modbus_unit_count: metrics.otAssets.otAssetCount,
    default_rule_count: metrics.detection.defaultRuleCount,
    custom_rule_count: metrics.detection.customRuleCount,
    total_rule_count: metrics.detection.totalRuleCount,
    total_incident_count: metrics.incidents.totalIncidentCount,
    detection_feasibility_matrix: metrics.detection.feasibilityRows.map((row) => ({
      detection_type: row.detectionType,
      feasibility_status: row.feasibility,
      evidence_basis: row.evidenceBasis,
      limitation_note: row.limitationNote,
    })),
    detection_signal_distribution: [
      { signal: 'Unknown Client', count: metrics.detection.signals.unknownClient },
      { signal: 'Outside Hours', count: metrics.detection.signals.outsideHours },
      { signal: 'Likely Attack', count: metrics.detection.signals.likelyAttack },
      { signal: 'Modbus Disrupted', count: metrics.detection.signals.modbusDisrupted },
      { signal: 'External Origin', count: metrics.detection.signals.externalOrigin },
    ].filter((item) => item.count > 0),
  };
}

export function buildRiskObservationsInput(
  data: ReportData,
  startDate: string,
  endDate: string,
) {
  const metrics = deriveReportMetrics(data);

  const likelyAttackPercent = metrics.risk.totalSecurityEvents > 0
    ? Math.round((metrics.risk.likelyAttackEvents / metrics.risk.totalSecurityEvents) * 100)
    : 0;

  const unknownClientPercent = metrics.risk.totalSecurityEvents > 0
    ? Math.round((metrics.risk.unknownClientEvents / metrics.risk.totalSecurityEvents) * 100)
    : 0;

  const externalOriginPercent = metrics.risk.totalSecurityEvents > 0
    ? Math.round((metrics.risk.externalOriginEvents / metrics.risk.totalSecurityEvents) * 100)
    : 0;

  return {
    report_start: startDate,
    report_end: endDate,
    total_security_events: metrics.risk.totalSecurityEvents,
    unknown_client_events: metrics.risk.unknownClientEvents,
    unknown_client_percent: unknownClientPercent,
    likely_attack_events: metrics.risk.likelyAttackEvents,
    likely_attack_percent: likelyAttackPercent,
    external_origin_events: metrics.risk.externalOriginEvents,
    external_origin_percent: externalOriginPercent,
    under_investigation_events: metrics.risk.verdict.underInvestigation,
    likely_legitimate_events: metrics.risk.verdict.likelyLegitimate,
    severity_distribution: metrics.risk.severity,
    verdict_distribution: {
      likely_legitimate: metrics.risk.verdict.likelyLegitimate,
      likely_legitimate_unknown_ip: metrics.risk.verdict.likelyLegitimateUnknownIp,
      under_investigation: metrics.risk.verdict.underInvestigation,
      likely_attack: metrics.risk.verdict.likelyAttack,
    },
    high_risk_source_count: metrics.risk.riskSources,
    high_risk_flow_count: metrics.communication.highRiskFlows,
    total_incident_count: metrics.incidents.totalIncidentCount,
    top_incident_groups: metrics.incidents.topIncidentGroups.map((group) => ({
      group_key: group.groupKey,
      incident_count: group.incidentCount,
      open_incident_count: group.openIncidentCount,
      event_count: group.eventCount,
      max_severity: group.maxSeverity,
      max_risk_score: group.maxRiskScore,
    })),
    max_risk_score: metrics.risk.maxRiskScore,
    avg_risk_score: metrics.risk.avgRiskScore.toFixed(1),
    top_risky_sources: metrics.risk.topRiskSources.slice(0, 5).map((row) => ({
      source_ip_or_name: row.sourceIp,
      event_count: row.eventCount,
      max_risk_score: row.maxRiskScore,
      avg_risk_score: row.avgRiskScore,
    })),
  };
}

export function buildConclusionPageInput(
  data: ReportData,
  startDate: string,
  endDate: string,
): ConclusionPageInput {
  const metrics = deriveReportMetrics(data);

  return {
    report_start: startDate,
    report_end: endDate,
    overall_risk_level: metrics.risk.riskPosture,
    risk_findings_count: metrics.risk.riskSources,
    observed_coverage_status: metrics.coverage.monitoringCoverageStatus,
    observed_assets: metrics.otAssets.otAssetCount,
    observed_paths: metrics.communication.communicationPaths,
    control_reliability_status: metrics.communication.controlStability,
    modbus_success_rate: metrics.communication.modbusSuccessRate,
    modbus_error_count: metrics.communication.modbusErrors,
    detection_readiness_status: metrics.detection.readiness,
    high_feasibility_count: metrics.detection.highFeasibilityCount,
    partial_feasibility_count: metrics.detection.partialFeasibilityCount,
    low_feasibility_count: metrics.detection.lowFeasibilityCount,
    stale_or_missing_count: metrics.devices.staleOrMissing,
    high_risk_source_count: metrics.risk.riskSources,
    high_risk_flow_count: metrics.communication.highRiskFlows,
    total_incident_count: metrics.incidents.totalIncidentCount,
    default_rule_count: metrics.detection.defaultRuleCount,
    custom_rule_count: metrics.detection.customRuleCount,
    visibility_limitation_summary: metrics.coverage.visibilityGapSummary,
  };
}

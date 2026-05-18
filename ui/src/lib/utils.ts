import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import useDeviceMappingsStore from "@/stores/device-mappings-store";

const LEGACY_OT_FRIENDLY_DEVICE_BY_IP: Record<string, string> = Object.freeze({
  "10.40.20.42": "EV Charger",
  "10.40.20.20": "Industrial Cloud Gateway",
  "10.40.20.10": "OT Gateway / Smart Logger / Unit 0",
});
const IP_DOT_VARIANTS_REGEX = /[。．｡]/g;
const WHITESPACE_REGEX = /\s+/g;
const INVISIBLE_IP_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeOtIpKey(ip?: string | null): string {
  return (ip ?? "")
    .replace(IP_DOT_VARIANTS_REGEX, ".")
    .replace(INVISIBLE_IP_CHARS_REGEX, "")
    .replace(WHITESPACE_REGEX, "")
    .trim();
}

export function resolveOtDeviceNameByIp(ip?: string | null): string | null {
  if (!ip) {
    return null;
  }

  const normalizedIp = normalizeOtIpKey(ip);
  if (!normalizedIp) {
    return null;
  }

  const mappings = useDeviceMappingsStore.getState().mappings;
  const match = mappings.find(
    (mapping) => (
      mapping.is_active
      && mapping.mapping_type === "ip"
      && normalizeOtIpKey(mapping.ip_address) === normalizedIp
    ),
  );

  if (match?.display_name) {
    return match.display_name;
  }

  return LEGACY_OT_FRIENDLY_DEVICE_BY_IP[normalizedIp] ?? null;
}

export function resolveOtDeviceNameByUnitId(unitId?: number | null): string | null {
  if (unitId === null || unitId === undefined || !Number.isFinite(unitId)) {
    return null;
  }

  const mappings = useDeviceMappingsStore.getState().mappings;
  const match = mappings.find(
    (mapping) => (
      mapping.is_active
      && mapping.mapping_type === "modbus_unit"
      && mapping.unit_id === unitId
    ),
  );

  return match?.display_name ?? null;
}

export function isMappedOtDeviceIp(ip?: string | null): boolean {
  return resolveOtDeviceNameByIp(ip) !== null;
}

export function formatOtHostLabel(ip?: string | null): string {
  if (!ip) {
    return "-";
  }

  return resolveOtDeviceNameByIp(ip) ?? ip;
}

export function formatOtUnitLabel(unitId: number): string {
  const mapped = resolveOtDeviceNameByUnitId(unitId);
  if (mapped) {
    return mapped;
  }

  return `Unit ${unitId}`;
}

const POWER_DEVICE_TYPE_LABELS: Record<string, string> = Object.freeze({
  smartlogger3000: "Smart Logger",
  inverter: "Inverter",
  power_meter: "Power Meter",
  emi: "Environmental Sensor",
});

export function formatPowerDeviceTypeLabel(deviceType?: string | null): string {
  if (!deviceType) {
    return "-";
  }

  const mappedLabel = POWER_DEVICE_TYPE_LABELS[deviceType];
  if (mappedLabel) {
    return mappedLabel;
  }

  return deviceType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatNumberShort(value: number, maximumFractionDigits = 1): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const absoluteValue = Math.abs(value);
  const clampedFractionDigits = Math.max(0, maximumFractionDigits);
  if (absoluteValue < 10_000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: clampedFractionDigits,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: clampedFractionDigits,
  })
    .format(value)
    .replace("k", "K")
    .replace("m", "M")
    .replace("b", "B");
}

export function formatMetricValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const normalized = trimmed.replaceAll(",", "");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return value;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  const decimalPlaces = normalized.includes(".")
    ? Math.min((normalized.split(".")[1] || "").length, 2)
    : 0;
  return formatNumberShort(parsed, decimalPlaces);
}

export function formatCompactNumber(value: number, maximumFractionDigits = 1) {
  return formatNumberShort(value, maximumFractionDigits);
}

export function formatDecimal(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatDateTimeInBangkok(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(dateString));
}

export function formatPortDate(dateString?: string | null) {
  if (!dateString) {
    return "No activity yet";
  }

  return formatDateTimeInBangkok(dateString);
}

export function formatTimeInBangkok(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

export function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

export const USER_STATUS_FILTER_OPTIONS: Filter[] = [
  { name: "All Status", value: "all" },
  { name: "Active", value: "active" },
  { name: "Inactive", value: "inactive" },
  { name: "Locked", value: "locked" },
  { name: "Pending Verification", value: "pending_verification" },
];

export const USER_ROLE_FILTER_OPTIONS: Filter[] = [
  { name: "All Roles", value: "all" },
  { name: "Admin", value: "admin" },
  { name: "Viewer", value: "viewer" },
];

export const CREATE_USER_DEFAULT_VALUES: UserManagementUpsertFormValues = {
  username: "",
  email: "",
  role: "viewer",
  status: "pending_verification",
  notificationEnabled: true,
  password: "",
  confirmPassword: "",
};

export function normalizeUserManagementStatusFilter(
  statusFilter?: string | null,
): UserManagementStatusFilter {
  const normalized = statusFilter?.trim().toLowerCase();
  if (
    normalized === "active"
    || normalized === "inactive"
    || normalized === "locked"
    || normalized === "pending_verification"
  ) {
    return normalized;
  }
  return "all";
}

export function normalizeUserManagementRoleFilter(
  roleFilter?: string | null,
): UserManagementRoleFilter {
  const normalized = roleFilter?.trim().toLowerCase();
  if (normalized === "admin" || normalized === "viewer") {
    return normalized;
  }
  return "all";
}

export function formatUserManagementLastLogin(lastLogin: string | null) {
  if (!lastLogin) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastLogin));
}

export function normalizeUserManagementFormValues(
  values: UserManagementUpsertFormValues,
): UserManagementUpsertFormValues {
  return {
    username: values.username.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    status: values.status || "active",
    notificationEnabled: values.notificationEnabled,
    password: values.password,
    confirmPassword: values.confirmPassword,
  };
}

export function toUserManagementCreatePayload(
  values: UserManagementUpsertFormValues,
): UserManagementCreatePayload {
  const normalized = normalizeUserManagementFormValues(values);

  return {
    username: normalized.username,
    email: normalized.email,
    password: normalized.password || "",
    role: normalized.role,
    status: "pending_verification",
    notification_enabled: normalized.notificationEnabled,
  };
}

export function toUserManagementUpdatePayload(
  values: UserManagementUpsertFormValues,
): UserManagementUpdatePayload {
  const normalized = normalizeUserManagementFormValues(values);

  return {
    username: normalized.username,
    email: normalized.email,
    role: normalized.role,
    status: normalized.status,
    notification_enabled: normalized.notificationEnabled,
  };
}

export function mapUserManagementApiRowToUser(row: UserManagementApiUserRow): UserManagementUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    notificationEnabled: row.notification_enabled,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildUserManagementUsers(rows: UserManagementApiUserRow[]) {
  return rows.map(mapUserManagementApiRowToUser);
}

export function toUserManagementFormValues(user: UserManagementUser): UserManagementUpsertFormValues {
  return {
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    notificationEnabled: user.notificationEnabled,
  };
}

function extractApiErrorDetailMessage(detail: unknown): string | null {
  if (typeof detail === "string") {
    const normalized = detail.trim();
    return normalized || null;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          const typedItem = item as { msg?: unknown; message?: unknown };
          if (typeof typedItem.msg === "string" && typedItem.msg.trim()) {
            return typedItem.msg.trim();
          }
          if (typeof typedItem.message === "string" && typedItem.message.trim()) {
            return typedItem.message.trim();
          }
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join(" | ");
    }

    return null;
  }

  if (detail && typeof detail === "object") {
    const typedDetail = detail as { message?: unknown; detail?: unknown };
    if (typeof typedDetail.message === "string" && typedDetail.message.trim()) {
      return typedDetail.message.trim();
    }
    if (typeof typedDetail.detail === "string" && typedDetail.detail.trim()) {
      return typedDetail.detail.trim();
    }
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof AxiosError) {
    const responseDetail = extractApiErrorDetailMessage(error.response?.data?.detail);
    const nestedMessage = extractApiErrorDetailMessage(error.response?.data?.error?.message);
    const responseMessage = extractApiErrorDetailMessage(error.response?.data);
    return responseDetail || nestedMessage || responseMessage || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// Power monitoring helpers migrated from components/power-monitoring/utils.ts

export const POWER_MONITORING_DEFAULT_TIME_RANGE: PowerMonitoringTimeRange = "1h";
export const DASHBOARD_TIME_RANGES: Filter[] = [
  { name: "Last 1h", value: "1h" },
  { name: "Last 3h", value: "3h" },
  { name: "Last 24h", value: "24h" },
  { name: "Last 3d", value: "3d" },
  { name: "Last 7d", value: "7d" },
];
export const LIVE_SECURITY_EVENT_ROW_LIMITS: Filter[] = [
  { name: "7", value: "7" },
  { name: "15", value: "15" },
  { name: "30", value: "30" },
  { name: "50", value: "50" },
];
export const TOP_COMMUNICATION_FLOW_ROW_LIMITS = LIVE_SECURITY_EVENT_ROW_LIMITS;
export const LIVE_SECURITY_EVENTS_TABLE_KEY = "live-security-events";
export const TOP_COMMUNICATION_FLOWS_TABLE_KEY = "top-communication-flows";
export const LIVE_SECURITY_EVENTS_COLUMN_OPTIONS: TableColumnToggleOption[] = [
  { id: "timestamp", label: "Timestamp" },
  { id: "source", label: "Source" },
  { id: "sourceMac", label: "Source MAC" },
  { id: "destination", label: "Destination" },
  { id: "destinationMac", label: "Destination MAC" },
  { id: "protocol", label: "Protocol" },
  { id: "port", label: "Port" },
  { id: "direction", label: "Direction" },
  { id: "outsideHours", label: "Outside Hours" },
  { id: "modbusDisrupted", label: "Modbus Disrupted" },
  { id: "classification", label: "Classification" },
  { id: "identity", label: "Identity" },
  { id: "severity", label: "Severity" },
  { id: "verdict", label: "Verdict" },
  { id: "risk", label: "Risk" },
  { id: "action", label: "Action" },
];
export const TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS: TableColumnToggleOption[] = [
  { id: "firstSeen", label: "First Seen" },
  { id: "lastSeen", label: "Last Seen" },
  { id: "source", label: "Source" },
  { id: "destination", label: "Destination" },
  { id: "protocol", label: "Protocol" },
  { id: "port", label: "Port" },
  { id: "direction", label: "Direction" },
  { id: "severity", label: "Severity" },
  { id: "avgRisk", label: "Avg Risk" },
  { id: "maxRisk", label: "Peak Risk" },
  { id: "events", label: "Events" },
  { id: "share", label: "Share" },
];
export const POWER_MONITORING_TIME_RANGES = DASHBOARD_TIME_RANGES;

const POWER_MONITORING_DEVICE_TYPE_COLORS: Record<string, string> = {
  smartlogger3000: "#38bdf8",
  inverter: "#22c55e",
  power_meter: "#f59e0b",
  emi: "#a855f7",
};

const POWER_MONITORING_TELEMETRY_COVERAGE_CONFIG: Record<PowerTelemetryCoverageItem["coverageKey"], { name: string; fill: string }> = {
  reportingNormally: {
    name: "Reporting normally",
    fill: "#22c55e",
  },
  limitedTelemetry: {
    name: "Limited telemetry",
    fill: "#f59e0b",
  },
  staleOrMissing: {
    name: "Stale or missing",
    fill: "#ef4444",
  },
};

export const metricToneClasses: Record<PowerMetricTone, { delta: string; ring: string }> = {
  sky: {
    delta: "text-sky-300",
    ring: "from-sky-400/40 via-sky-300/10 to-transparent",
  },
  emerald: {
    delta: "text-emerald-300",
    ring: "from-emerald-400/40 via-emerald-300/10 to-transparent",
  },
  amber: {
    delta: "text-amber-300",
    ring: "from-amber-400/40 via-amber-300/10 to-transparent",
  },
  violet: {
    delta: "text-violet-300",
    ring: "from-violet-400/40 via-violet-300/10 to-transparent",
  },
  rose: {
    delta: "text-rose-300",
    ring: "from-rose-400/40 via-rose-300/10 to-transparent",
  },
};

export const POWER_MONITORING_KPI_CARD_TEMPLATES: PowerMetricCard[] = [
  {
    id: "observed-devices",
    title: "Observed Devices",
    value: "--",
    delta: "--",
    helper: "Currently monitored device set",
    trend: "steady",
    tone: "sky",
  },
  {
    id: "device-types",
    title: "Device Types",
    value: "--",
    delta: "--",
    helper: "Distinct telemetry device classes in the selected window",
    trend: "steady",
    tone: "violet",
  },
  {
    id: "reporting-cadence",
    title: "Reporting Cadence",
    value: "--",
    delta: "--",
    helper: "Estimated reporting interval across current telemetry",
    trend: "steady",
    tone: "emerald",
  },
  {
    id: "reporting-now",
    title: "Reporting Now",
    value: "--",
    delta: "--",
    helper: "Devices seen within the latest 10-minute window",
    trend: "steady",
    tone: "rose",
  },
  {
    id: "aggregate-power",
    title: "Aggregate Active Power",
    value: "--",
    delta: "--",
    helper: "Latest measured site-wide total",
    trend: "steady",
    tone: "amber",
  },
  {
    id: "daily-energy",
    title: "Daily Energy",
    value: "--",
    delta: "--",
    helper: "Latest reported daily accumulation",
    trend: "steady",
    tone: "sky",
  },
];

export function getFreshnessClass(freshnessMinutes: number) {
  if (freshnessMinutes <= 1) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (freshnessMinutes <= 5) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-rose-500/40 bg-rose-500/10 text-rose-300";
}

export function getHealthClass(health: PowerLatestStatusRow["health"]) {
  if (health === "Healthy") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (health === "Watch") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

export function getHeatColor(value: number, maxValue: number) {
  const normalized = maxValue === 0 ? 0 : value / maxValue;
  const hue = 210 - normalized * 85;
  const lightness = 30 + normalized * 18;
  const alpha = 0.18 + normalized * 0.65;

  return `hsla(${hue}, 92%, ${lightness}%, ${alpha})`;
}

export function formatTrendText(metric: PowerMetricCard) {
  if (metric.trend === "steady") {
    return metric.delta;
  }

  return `${metric.delta} ${metric.trend}`;
}

export function formatLatestMeasurement(row: PowerLatestStatusRow) {
  if (typeof row.activePower === "number") {
    return `${formatDecimal(row.activePower)} kW active power`;
  }

  if (typeof row.meterVoltage === "number") {
    return `${formatDecimal(row.meterVoltage)} V meter voltage`;
  }

  if (typeof row.irradianceSecondary === "number") {
    return `${formatCompactNumber(row.irradianceSecondary, 0)} irradiance secondary`;
  }

  return "Structured telemetry available";
}

export function getPowerMonitoringDataForRange(
  data: PowerDashboardData,
  _range: PowerMonitoringTimeRange,
) {
  return data;
}

export function isPowerMonitoringTimeRange(value: string | null): value is PowerMonitoringTimeRange {
  return value === "1h" || value === "3h" || value === "24h" || value === "3d" || value === "7d";
}

export function getDashboardTimeRangeQueryParams(searchParams: URLSearchParams): DashboardTimeRangeQueryParams {
  const customStart = searchParams.get("customStart");
  const customEnd = searchParams.get("customEnd");

  if (customStart && customEnd) {
    return {
      timeRange: "custom",
      customStart,
      customEnd,
    };
  }

  const timeRange = searchParams.get("timeRange");

  return {
    timeRange: isPowerMonitoringTimeRange(timeRange) ? timeRange : POWER_MONITORING_DEFAULT_TIME_RANGE,
    customStart: null,
    customEnd: null,
  };
}

export function getPowerMonitoringChartRange(timeRange: PowerMonitoringQueryTimeRange): PowerMonitoringTimeRange {
  if (timeRange === "custom") {
    return POWER_MONITORING_DEFAULT_TIME_RANGE;
  }

  return timeRange;
}

export function buildPowerMonitoringPowerTrendChartData(
  points: PowerMonitoringPowerTrendApiPoint[],
): PowerTrendPoint[] {
  return points.map((point) => ({
    time: formatTimeInBangkok(point.bucket_start),
    smartloggerAggregate: point.smartlogger_aggregate,
    inverterOutput: point.inverter_output,
    meterActivePower: point.meter_active_power,
  }));
}

export function buildPowerMonitoringEnvironmentalSignalsChartData(
  points: PowerMonitoringEnvironmentalSignalsApiPoint[],
): PowerEnvironmentalPoint[] {
  return points.map((point) => ({
    time: formatTimeInBangkok(point.bucket_start),
    irradianceSecondary: point.irradiance_secondary,
    moduleTemperature: point.module_temperature,
    activePower: point.active_power,
    meterVoltage: point.meter_voltage,
  }));
}

function getPowerMonitoringTelemetryVisibilityLabel(deviceType: string, signalCount: number) {
  if (deviceType === "power_meter") {
    return "Electrical focus";
  }

  if (deviceType === "emi") {
    return "Sensor only";
  }

  if (signalCount >= 12) {
    return "Rich telemetry";
  }

  if (signalCount >= 6) {
    return "Moderate telemetry";
  }

  return "Limited telemetry";
}

export function buildPowerMonitoringTelemetryProfileData(
  items: PowerMonitoringTelemetryProfileApiItem[],
): PowerTelemetryProfileItem[] {
  return items.map((item) => ({
    deviceType: item.device_type,
    deviceCount: item.device_count,
    signalCount: item.signal_count,
    reportingIntervalSeconds: item.reporting_interval_seconds ? Math.round(item.reporting_interval_seconds) : 0,
    visibilityLabel: getPowerMonitoringTelemetryVisibilityLabel(item.device_type, item.signal_count),
    fill: POWER_MONITORING_DEVICE_TYPE_COLORS[item.device_type] ?? "#94a3b8",
  }));
}

function formatPowerMonitoringReportingCadenceWindow(
  bucketStart: string,
  timeRange: PowerMonitoringQueryTimeRange,
) {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  if (timeRange === "24h" || timeRange === "3d" || timeRange === "7d" || timeRange === "custom") {
    options.month = "short";
    options.day = "2-digit";
  }

  return new Intl.DateTimeFormat("en-US", options).format(new Date(bucketStart));
}

export function buildPowerMonitoringReportingCadenceData(
  points: PowerMonitoringReportingCadenceApiPoint[],
  timeRange: PowerMonitoringQueryTimeRange,
): PowerReportingCadenceRow[] {
  return points.map((point) => ({
    window: formatPowerMonitoringReportingCadenceWindow(point.bucket_start, timeRange),
    smartlogger3000: point.smartlogger3000,
    inverter: point.inverter,
    power_meter: point.power_meter,
    emi: point.emi,
  }));
}

export function buildPowerMonitoringTelemetryCoverageData(
  items: PowerMonitoringTelemetryCoverageApiItem[],
): PowerTelemetryCoverageItem[] {
  return items.map((item) => ({
    coverageKey: item.coverage_key,
    name: POWER_MONITORING_TELEMETRY_COVERAGE_CONFIG[item.coverage_key].name,
    value: item.value,
    fill: POWER_MONITORING_TELEMETRY_COVERAGE_CONFIG[item.coverage_key].fill,
  }));
}

export function buildPowerMonitoringLatestStatusData(
  rows: PowerMonitoringLatestStatusApiRow[],
): PowerLatestStatusRow[] {
  return rows.map((row) => ({
    deviceName: row.device_name,
    deviceType: row.device_type,
    unitId: row.unit_id,
    site: row.site,
    lastSeen: row.last_seen,
    freshnessMinutes: row.freshness_minutes,
    health: row.health,
    summary: row.summary,
    activePower: row.active_power ?? undefined,
    dailyEnergy: row.daily_energy ?? undefined,
    meterVoltage: row.meter_voltage ?? undefined,
    meterActivePower: row.meter_active_power ?? undefined,
    irradianceSecondary: row.irradiance_secondary ?? undefined,
    moduleTemperature: row.module_temperature ?? undefined,
  }));
}

const TIME_RANGE_TO_MINUTES: Record<DashboardTimeRange, number> = {
  "15m": 15,
  "1h": 60,
  "6h": 360,
  "24h": 1440,
};

const SEVERITY_WEIGHT: Record<DashboardSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const DASHBOARD_DEFAULT_FILTERS: DashboardFilters = {
  timeRange: "1h",
  severity: "all",
  verdict: "all",
  sourceIp: "all",
  destinationIp: "all",
  protocol: "all",
  unitId: "all",
};

export const DASHBOARD_TIME_RANGE_OPTIONS: DashboardFilterOption[] = [
  { value: "15m", label: "Last 15m" },
  { value: "1h", label: "Last 1h" },
  { value: "6h", label: "Last 6h" },
  { value: "24h", label: "Last 24h" },
];

export const DASHBOARD_SEVERITY_OPTIONS: DashboardFilterOption[] = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const DASHBOARD_VERDICT_OPTIONS: DashboardFilterOption[] = [
  { value: "all", label: "All verdicts" },
  { value: "LIKELY_ATTACK", label: "Likely attack" },
  { value: "UNDER_INVESTIGATION", label: "Under investigation" },
  { value: "LIKELY_LEGITIMATE_UNKNOWN_IP", label: "Likely legitimate (unknown IP)" },
  { value: "LIKELY_LEGITIMATE", label: "Likely legitimate" },
];

export const dashboardKpiToneClasses: Record<
  DashboardKpiTone,
  { delta: string; ring: string }
> = {
  sky: {
    delta: "text-sky-300",
    ring: "from-sky-400/40 via-sky-300/10 to-transparent",
  },
  emerald: {
    delta: "text-emerald-300",
    ring: "from-emerald-400/40 via-emerald-300/10 to-transparent",
  },
  amber: {
    delta: "text-amber-300",
    ring: "from-amber-400/40 via-amber-300/10 to-transparent",
  },
  violet: {
    delta: "text-violet-300",
    ring: "from-violet-400/40 via-violet-300/10 to-transparent",
  },
  rose: {
    delta: "text-rose-300",
    ring: "from-rose-400/40 via-rose-300/10 to-transparent",
  },
  red: {
    delta: "text-red-300",
    ring: "from-red-500/45 via-red-400/12 to-transparent",
  },
};

export const dashboardSeverityBadgeClasses: Record<DashboardSeverity, string> = {
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  high: "border-orange-500/40 bg-orange-500/12 text-orange-300",
  critical: "border-red-500/45 bg-red-500/14 text-red-300",
};

export const dashboardVerdictBadgeClasses: Record<string, string> = {
  LIKELY_LEGITIMATE: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  LIKELY_LEGITIMATE_UNKNOWN_IP: "border-teal-500/40 bg-teal-500/10 text-teal-300",
  UNDER_INVESTIGATION: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  LIKELY_ATTACK: "border-red-500/45 bg-red-500/14 text-red-300",
};

export function dedupeNetworkEvents(data: DashboardVisibilityData["networkEvents"]) {
  const deduped = new Map<string, DashboardVisibilityData["networkEvents"][number]>();

  data.forEach((event) => {
    const tsBucket = Math.floor(new Date(event.timestamp).getTime() / 1000);
    const key = [
      tsBucket,
      event.sourceIp,
      event.destinationIp,
      event.sourcePort ?? "-",
      event.destinationPort ?? "-",
      event.trafficType,
      event.classification,
      event.verdict,
      event.riskScore,
    ].join("|");

    if (!deduped.has(key)) {
      deduped.set(key, event);
    }
  });

  return Array.from(deduped.values()).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

function getLatestTimestamp(data: DashboardVisibilityData) {
  const timestamps = [
    ...data.networkEvents.map((item) => +new Date(item.timestamp)),
    ...data.modbusSummaries.map((item) => +new Date(item.timestamp)),
    ...data.sessionVerdicts.map((item) => +new Date(item.timestamp)),
  ].filter((timestamp) => Number.isFinite(timestamp));

  return timestamps.length ? Math.max(...timestamps) : Date.now();
}

function buildProtocolLabel(protocol: string) {
  return protocol.toUpperCase();
}

function isPrivateIPv4Address(ip: string) {
  const chunks = ip.split(".").map((part) => Number(part));
  if (chunks.length !== 4 || chunks.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  if (chunks[0] === 10) {
    return true;
  }

  if (chunks[0] === 172 && chunks[1] >= 16 && chunks[1] <= 31) {
    return true;
  }

  if (chunks[0] === 192 && chunks[1] === 168) {
    return true;
  }

  if (chunks[0] === 127) {
    return true;
  }

  if (chunks[0] === 169 && chunks[1] === 254) {
    return true;
  }

  return false;
}

function buildBucketKey(timestamp: string) {
  const date = new Date(timestamp);
  date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 5) * 5, 0, 0);
  return date.toISOString();
}

function formatBucketLabel(bucketIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(bucketIso));
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getDashboardFilterOptions(data: DashboardVisibilityData) {
  const sourceIp = Array.from(new Set(data.networkEvents.map((item) => item.sourceIp))).sort();
  const destinationIp = Array.from(new Set(data.networkEvents.map((item) => item.destinationIp))).sort();
  const protocol = Array.from(new Set(data.networkEvents.map((item) => buildProtocolLabel(item.protocol)))).sort();
  const unitId = Array.from(new Set(data.modbusSummaries.map((item) => item.unitId))).sort((a, b) => a - b);

  return {
    sourceIp,
    destinationIp,
    protocol,
    unitId,
  };
}

export function filterDashboardData(data: DashboardVisibilityData, filters: DashboardFilters): DashboardFilteredData {
  const latestTimestamp = getLatestTimestamp(data);
  const rangeMinutes = TIME_RANGE_TO_MINUTES[filters.timeRange];
  const startTimestamp = latestTimestamp - rangeMinutes * 60 * 1000;

  const dedupedNetworkEvents = dedupeNetworkEvents(data.networkEvents);

  const networkEvents = dedupedNetworkEvents.filter((event) => {
    const eventTimestamp = +new Date(event.timestamp);

    if (eventTimestamp < startTimestamp) {
      return false;
    }

    if (filters.severity !== "all" && event.severity !== filters.severity) {
      return false;
    }

    if (filters.verdict !== "all" && event.verdict !== filters.verdict) {
      return false;
    }

    if (filters.sourceIp !== "all" && event.sourceIp !== filters.sourceIp) {
      return false;
    }

    if (filters.destinationIp !== "all" && event.destinationIp !== filters.destinationIp) {
      return false;
    }

    if (filters.protocol !== "all" && buildProtocolLabel(event.protocol) !== filters.protocol) {
      return false;
    }

    return true;
  });

  const modbusSummaries = data.modbusSummaries.filter((summary) => {
    const summaryTimestamp = +new Date(summary.timestamp);

    if (summaryTimestamp < startTimestamp) {
      return false;
    }

    if (filters.unitId !== "all" && summary.unitId !== filters.unitId) {
      return false;
    }

    return true;
  });

  const sessionVerdicts = data.sessionVerdicts.filter((session) => {
    const sessionTimestamp = +new Date(session.timestamp);

    if (sessionTimestamp < startTimestamp) {
      return false;
    }

    if (filters.sourceIp !== "all" && session.sourceIp !== filters.sourceIp) {
      return false;
    }

    if (filters.verdict !== "all" && session.verdict !== filters.verdict) {
      return false;
    }

    return true;
  });

  return {
    networkEvents,
    modbusSummaries,
    sessionVerdicts,
  };
}

export function buildDashboardKpiCards(data: DashboardFilteredData): DashboardKpiCard[] {
  const distinctAssets = new Set<string>();
  data.networkEvents.forEach((event) => {
    distinctAssets.add(event.sourceIp);
    distinctAssets.add(event.destinationIp);
  });

  const distinctFlowPaths = new Set(
    data.networkEvents.map(
      (event) => `${event.sourceIp}|${event.destinationIp}|${event.destinationPort ?? "-"}`,
    ),
  );

  const externalSourceEvents = data.networkEvents.filter(
    (event) => !isPrivateIPv4Address(event.sourceIp),
  ).length;

  const unknownHostEvents = data.networkEvents.filter((event) => event.unknownClient).length;

  const likelyAttackCount = data.networkEvents.filter((event) => event.verdict === "LIKELY_ATTACK").length;

  const averageRisk = average(data.networkEvents.map((event) => event.riskScore));
  const maxRisk = data.networkEvents.length
    ? Math.max(...data.networkEvents.map((event) => event.riskScore))
    : 0;
  const totalEvents = data.networkEvents.length;
  const likelyAttackRate = totalEvents ? (likelyAttackCount / totalEvents) * 100 : 0;
  const unknownClientRate = totalEvents ? (unknownHostEvents / totalEvents) * 100 : 0;
  const externalSourceRate = totalEvents ? (externalSourceEvents / totalEvents) * 100 : 0;

  const totalRequests = data.modbusSummaries.reduce((sum, item) => sum + item.totalRequests, 0);
  const totalSuccess = data.modbusSummaries.reduce((sum, item) => sum + item.successCount, 0);
  const totalErrors = data.modbusSummaries.reduce((sum, item) => sum + item.errorCount, 0);
  const totalSlow = data.modbusSummaries.reduce((sum, item) => sum + item.slowCount, 0);
  const successRate = totalRequests ? (totalSuccess / totalRequests) * 100 : 0;

  return [
    {
      id: "active-assets",
      title: "Observed OT Assets (IPs)",
      value: `${distinctAssets.size}`,
      helper: `${formatCompactNumber(totalEvents, 0)} host-level events in this PoC window`,
      trendLabel: "Asset coverage",
      tone: "sky",
    },
    {
      id: "observed-flows",
      title: "Observed Host Flows",
      value: `${distinctFlowPaths.size}`,
      helper: "Unique source -> destination -> port communication paths",
      trendLabel: "Path mapping",
      tone: "violet",
    },
    {
      id: "unknown-host-events",
      title: "Unknown Client Events",
      value: `${unknownHostEvents}`,
      helper: `${formatDecimal(unknownClientRate, 1)}% marked unknown_client=true`,
      trendLabel: "Identity gap",
      tone: unknownHostEvents >= 3 ? "red" : unknownHostEvents > 0 ? "amber" : "emerald",
    },
    {
      id: "likely-attack-events",
      title: "Likely Attack Events",
      value: `${likelyAttackCount}`,
      helper: `${formatDecimal(likelyAttackRate, 1)}% of events, max risk ${maxRisk}, avg ${formatDecimal(averageRisk, 1)}`,
      trendLabel: "Threat signal",
      tone: likelyAttackCount > 0 ? "red" : averageRisk >= 35 ? "amber" : "emerald",
    },
    {
      id: "external-source-events",
      title: "External Origin Events",
      value: `${externalSourceEvents}`,
      helper: `${formatDecimal(externalSourceRate, 1)}% from non-private source IP ranges`,
      trendLabel: "Ingress exposure",
      tone: externalSourceEvents >= 2 ? "red" : externalSourceEvents > 0 ? "amber" : "emerald",
    },
    {
      id: "modbus-success-rate",
      title: "Modbus Operation Health",
      value: `${formatDecimal(successRate, 1)}%`,
      helper: `${formatCompactNumber(totalRequests, 0)} requests | ${totalErrors} errors | ${totalSlow} slow polls`,
      trendLabel: "Control reliability",
      tone: successRate < 99 || totalErrors > 0 ? (totalErrors > 5 ? "red" : "amber") : "emerald",
    },
  ];
}

export function buildDashboardSankeyRows(data: DashboardFilteredData): DashboardSankeyLinkRow[] {
  const grouped = new Map<string, DashboardSankeyLinkRow & { severityWeight: number; riskSamples: number[]; protocolSet: Set<string> }>();

  data.networkEvents.forEach((event) => {
    const portSuffix = event.destinationPort ? `:${event.destinationPort}` : "";
    const target = `${event.destinationIp}${portSuffix}`;
    const key = `${event.sourceIp}|${target}`;

    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        source: event.sourceIp,
        target,
        weight: 1,
        highestSeverity: event.severity,
        avgRiskScore: event.riskScore,
        protocols: buildProtocolLabel(event.protocol),
        lastSeen: event.timestamp,
        severityWeight: SEVERITY_WEIGHT[event.severity],
        riskSamples: [event.riskScore],
        protocolSet: new Set([buildProtocolLabel(event.protocol)]),
      });
      return;
    }

    existing.weight += 1;
    existing.riskSamples.push(event.riskScore);
    existing.protocolSet.add(buildProtocolLabel(event.protocol));

    const incomingSeverityWeight = SEVERITY_WEIGHT[event.severity];
    if (incomingSeverityWeight > existing.severityWeight) {
      existing.highestSeverity = event.severity;
      existing.severityWeight = incomingSeverityWeight;
    }

    if (+new Date(event.timestamp) > +new Date(existing.lastSeen)) {
      existing.lastSeen = event.timestamp;
    }
  });

  return Array.from(grouped.values())
    .map((item) => ({
      source: item.source,
      target: item.target,
      weight: item.weight,
      highestSeverity: item.highestSeverity,
      avgRiskScore: Number(average(item.riskSamples).toFixed(1)),
      protocols: Array.from(item.protocolSet).join(", "),
      lastSeen: item.lastSeen,
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function buildDashboardSeverityTrendRows(data: DashboardFilteredData): DashboardSeverityTrendRow[] {
  const grouped = new Map<string, DashboardSeverityTrendRow>();

  data.networkEvents.forEach((event) => {
    const key = buildBucketKey(event.timestamp);

    if (!grouped.has(key)) {
      grouped.set(key, {
        bucket: formatBucketLabel(key),
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      });
    }

    const row = grouped.get(key);
    if (row) {
      row[event.severity] += 1;
    }
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => +new Date(a) - +new Date(b))
    .map(([, value]) => value);
}

export function buildDashboardVerdictTrendRows(data: DashboardFilteredData): DashboardVerdictTrendRow[] {
  const grouped = new Map<string, DashboardVerdictTrendRow>();

  data.networkEvents.forEach((event) => {
    const key = buildBucketKey(event.timestamp);

    if (!grouped.has(key)) {
      grouped.set(key, {
        bucket: formatBucketLabel(key),
        LIKELY_LEGITIMATE: 0,
        LIKELY_LEGITIMATE_UNKNOWN_IP: 0,
        UNDER_INVESTIGATION: 0,
        LIKELY_ATTACK: 0,
      });
    }

    const row = grouped.get(key);
    if (row) {
      row[event.verdict] += 1;
    }
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => +new Date(a) - +new Date(b))
    .map(([, value]) => value);
}

export function buildDashboardTopRiskSourceRows(data: DashboardFilteredData): DashboardRiskSourceRow[] {
  const grouped = new Map<string, { sourceIp: string; eventCount: number; riskSamples: number[]; maxRiskScore: number }>();

  data.networkEvents.forEach((event) => {
    const existing = grouped.get(event.sourceIp);

    if (!existing) {
      grouped.set(event.sourceIp, {
        sourceIp: event.sourceIp,
        eventCount: 1,
        riskSamples: [event.riskScore],
        maxRiskScore: event.riskScore,
      });
      return;
    }

    existing.eventCount += 1;
    existing.riskSamples.push(event.riskScore);
    existing.maxRiskScore = Math.max(existing.maxRiskScore, event.riskScore);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      sourceIp: item.sourceIp,
      eventCount: item.eventCount,
      avgRiskScore: Number(average(item.riskSamples).toFixed(1)),
      maxRiskScore: item.maxRiskScore,
    }))
    .sort((a, b) => b.maxRiskScore - a.maxRiskScore || b.eventCount - a.eventCount)
    .slice(0, 8);
}

export function buildDashboardModbusLatencyRows(data: DashboardFilteredData): DashboardModbusLatencyRow[] {
  const grouped = new Map<string, DashboardModbusLatencyRow>();

  data.modbusSummaries.forEach((summary) => {
    const key = buildBucketKey(summary.timestamp);

    if (!grouped.has(key)) {
      grouped.set(key, {
        bucket: formatBucketLabel(key),
        unit0AvgMs: 0,
        unit1AvgMs: 0,
        unit11AvgMs: 0,
        unit100AvgMs: 0,
      });
    }

    const row = grouped.get(key);
    if (!row) {
      return;
    }

    if (summary.unitId === 0) {
      row.unit0AvgMs = summary.responseTimeAvgMs;
    } else if (summary.unitId === 1) {
      row.unit1AvgMs = summary.responseTimeAvgMs;
    } else if (summary.unitId === 11) {
      row.unit11AvgMs = summary.responseTimeAvgMs;
    } else if (summary.unitId === 100) {
      row.unit100AvgMs = summary.responseTimeAvgMs;
    }
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => +new Date(a) - +new Date(b))
    .map(([, value]) => value);
}

export function buildDashboardModbusRequestErrorRows(data: DashboardFilteredData): DashboardModbusRequestsErrorRow[] {
  const grouped = new Map<string, DashboardModbusRequestsErrorRow>();

  data.modbusSummaries.forEach((summary) => {
    const key = buildBucketKey(summary.timestamp);

    if (!grouped.has(key)) {
      grouped.set(key, {
        bucket: formatBucketLabel(key),
        totalRequests: 0,
        totalErrors: 0,
      });
    }

    const row = grouped.get(key);
    if (row) {
      row.totalRequests += summary.totalRequests;
      row.totalErrors += summary.errorCount;
    }
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => +new Date(a) - +new Date(b))
    .map(([, value]) => value);
}

export function buildDashboardFlowTableRows(data: DashboardFilteredData): DashboardFlowTableRow[] {
  const grouped = new Map<
    string,
    DashboardFlowTableRow & { severityWeight: number; riskSamples: number[] }
  >();

  data.networkEvents.forEach((event) => {
    const key = [
      event.sourceIp,
      event.destinationIp,
      buildProtocolLabel(event.protocol),
      event.destinationPort ?? "-",
      event.direction,
    ].join("|");

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        sourceIp: event.sourceIp,
        destinationIp: event.destinationIp,
        protocol: buildProtocolLabel(event.protocol),
        port: event.destinationPort ? String(event.destinationPort) : "-",
        direction: event.direction,
        eventCount: 1,
        unknownClientEvents: event.unknownClient ? 1 : 0,
        unknownClientRate: event.unknownClient ? 100 : 0,
        avgRiskScore: event.riskScore,
        maxRiskScore: event.riskScore,
        highestSeverity: event.severity,
        likelyAttackEvents: event.verdict === "LIKELY_ATTACK" ? 1 : 0,
        outsideHoursEvents: event.outsideBusinessHours ? 1 : 0,
        outsideHoursRate: event.outsideBusinessHours ? 100 : 0,
        modbusDisruptedEvents: event.modbusDisrupted ? 1 : 0,
        modbusDisruptedRate: event.modbusDisrupted ? 100 : 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        severityWeight: SEVERITY_WEIGHT[event.severity],
        riskSamples: [event.riskScore],
      });
      return;
    }

    existing.eventCount += 1;
    existing.riskSamples.push(event.riskScore);
    if (event.unknownClient) {
      existing.unknownClientEvents += 1;
    }
    if (event.verdict === "LIKELY_ATTACK") {
      existing.likelyAttackEvents += 1;
    }
    if (event.outsideBusinessHours) {
      existing.outsideHoursEvents += 1;
    }
    if (event.modbusDisrupted) {
      existing.modbusDisruptedEvents += 1;
    }
    existing.avgRiskScore = average(existing.riskSamples);
    existing.maxRiskScore = Math.max(existing.maxRiskScore, event.riskScore);
    existing.unknownClientRate = existing.eventCount > 0
      ? (existing.unknownClientEvents / existing.eventCount) * 100
      : 0;
    existing.outsideHoursRate = existing.eventCount > 0
      ? (existing.outsideHoursEvents / existing.eventCount) * 100
      : 0;
    existing.modbusDisruptedRate = existing.eventCount > 0
      ? (existing.modbusDisruptedEvents / existing.eventCount) * 100
      : 0;

    const incomingSeverityWeight = SEVERITY_WEIGHT[event.severity];
    if (incomingSeverityWeight > existing.severityWeight) {
      existing.highestSeverity = event.severity;
      existing.severityWeight = incomingSeverityWeight;
    }

    if (+new Date(event.timestamp) > +new Date(existing.lastSeen)) {
      existing.lastSeen = event.timestamp;
    }
    if (+new Date(event.timestamp) < +new Date(existing.firstSeen)) {
      existing.firstSeen = event.timestamp;
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.eventCount - a.eventCount || b.avgRiskScore - a.avgRiskScore)
    .map(({ severityWeight: _severityWeight, riskSamples: _riskSamples, ...row }) => ({
      ...row,
      avgRiskScore: Number(row.avgRiskScore.toFixed(1)),
      maxRiskScore: Number(row.maxRiskScore.toFixed(1)),
      unknownClientRate: Number(row.unknownClientRate.toFixed(1)),
      outsideHoursRate: Number(row.outsideHoursRate.toFixed(1)),
      modbusDisruptedRate: Number(row.modbusDisruptedRate.toFixed(1)),
    }))
    .slice(0, 15);
}

export function buildDashboardModbusUnitHealthRows(data: DashboardFilteredData): DashboardModbusUnitHealthRow[] {
  const grouped = new Map<number, DashboardModbusUnitHealthRow & { weightedAvgAccumulator: number }>();

  data.modbusSummaries.forEach((summary) => {
    const existing = grouped.get(summary.unitId);

    if (!existing) {
      grouped.set(summary.unitId, {
        unitId: summary.unitId,
        totalRequests: summary.totalRequests,
        successCount: summary.successCount,
        errorCount: summary.errorCount,
        slowCount: summary.slowCount,
        responseTimeAvgMs: summary.responseTimeAvgMs,
        responseTimeMaxMs: summary.responseTimeMaxMs,
        weightedAvgAccumulator: summary.responseTimeAvgMs * summary.totalRequests,
      });
      return;
    }

    existing.totalRequests += summary.totalRequests;
    existing.successCount += summary.successCount;
    existing.errorCount += summary.errorCount;
    existing.slowCount += summary.slowCount;
    existing.responseTimeMaxMs = Math.max(existing.responseTimeMaxMs, summary.responseTimeMaxMs);
    existing.weightedAvgAccumulator += summary.responseTimeAvgMs * summary.totalRequests;
    existing.responseTimeAvgMs = existing.weightedAvgAccumulator / existing.totalRequests;
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.unitId - b.unitId)
    .map(({ weightedAvgAccumulator: _weightedAvgAccumulator, ...row }) => ({
      ...row,
      responseTimeAvgMs: Number(row.responseTimeAvgMs.toFixed(2)),
    }));
}

export function buildDashboardInsightItems(data: DashboardFilteredData): DashboardInsightItem[] {
  if (!data.networkEvents.length && !data.modbusSummaries.length) {
    return [
      {
        id: "insight-empty",
        title: "No evidence in current filters",
        detail: "Widen the time range or reset filters to populate PoC insights.",
        tone: "info",
      },
    ];
  }

  const topRiskSource = buildDashboardTopRiskSourceRows(data)[0];
  const destinationCounts = new Map<string, number>();
  data.networkEvents.forEach((event) => {
    destinationCounts.set(event.destinationIp, (destinationCounts.get(event.destinationIp) ?? 0) + 1);
  });

  const topTarget = Array.from(destinationCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const likelyAttackCount = data.networkEvents.filter((event) => event.verdict === "LIKELY_ATTACK").length;
  const publicSourceCount = data.networkEvents.filter(
    (event) => !isPrivateIPv4Address(event.sourceIp),
  ).length;
  const totalRequests = data.modbusSummaries.reduce((sum, row) => sum + row.totalRequests, 0);
  const totalErrors = data.modbusSummaries.reduce((sum, row) => sum + row.errorCount, 0);
  const totalSlow = data.modbusSummaries.reduce((sum, row) => sum + row.slowCount, 0);

  const insights: DashboardInsightItem[] = [];

  if (topRiskSource) {
    insights.push({
      id: "insight-risk-source",
      title: "Top risky source in this window",
      detail: `${topRiskSource.sourceIp} reached max risk ${topRiskSource.maxRiskScore} across ${topRiskSource.eventCount} events.`,
      tone: topRiskSource.maxRiskScore >= 80 ? "danger" : topRiskSource.maxRiskScore >= 50 ? "warn" : "info",
    });
  }

  if (topTarget) {
    insights.push({
      id: "insight-target",
      title: "Most targeted destination",
      detail: `${topTarget[0]} received ${topTarget[1]} observed events in this window.`,
      tone: "info",
    });
  }

  insights.push({
    id: "insight-attacks",
    title: "Hostile verdict pressure",
    detail: `${likelyAttackCount} events are currently classified as LIKELY_ATTACK.`,
    tone: likelyAttackCount > 0 ? "danger" : "good",
  });

  insights.push({
    id: "insight-external",
    title: "External exposure signal",
    detail: `${publicSourceCount} events originated from non-private source IP ranges.`,
    tone: publicSourceCount > 0 ? "warn" : "good",
  });

  if (totalRequests > 0) {
    insights.push({
      id: "insight-modbus-health",
      title: "Authorized control path health",
      detail: `${formatCompactNumber(totalRequests, 0)} Modbus requests with ${totalErrors} errors and ${totalSlow} slow polls.`,
      tone: totalErrors > 0 || totalSlow > 0 ? "warn" : "good",
    });
  }

  return insights.slice(0, 5);
}

export function buildDashboardPocAlignmentRows(data: DashboardFilteredData): DashboardPocAlignmentRow[] {
  const assets = new Set<string>();
  data.networkEvents.forEach((event) => {
    assets.add(event.sourceIp);
    assets.add(event.destinationIp);
  });

  const flows = new Set(data.networkEvents.map((event) => `${event.sourceIp}|${event.destinationIp}`));
  const unitIds = new Set(data.modbusSummaries.map((summary) => summary.unitId));
  const likelyAttackCount = data.networkEvents.filter((event) => event.verdict === "LIKELY_ATTACK").length;
  const scenarioCoverage = new Set(data.networkEvents.map((event) => event.classification)).size;
  const totalRequests = data.modbusSummaries.reduce((sum, row) => sum + row.totalRequests, 0);
  const totalErrors = data.modbusSummaries.reduce((sum, row) => sum + row.errorCount, 0);
  const totalSuccess = data.modbusSummaries.reduce((sum, row) => sum + row.successCount, 0);
  const successRate = totalRequests ? (totalSuccess / totalRequests) * 100 : 0;

  return [
    {
      id: "poc-asset-visibility",
      deliverable: "OT Asset & Communication Visibility",
      status: assets.size >= 4 && flows.size >= 4 ? "strong" : assets.size > 0 ? "partial" : "limited",
      evidence: `${assets.size} host assets and ${flows.size} host-level communication paths observed.`,
    },
    {
      id: "poc-control-behavior",
      deliverable: "Authorized Control Behavior Validation",
      status: totalRequests > 0 && totalErrors === 0 ? "strong" : totalRequests > 0 ? "partial" : "limited",
      evidence: `${formatCompactNumber(totalRequests, 0)} Modbus requests, success ${formatDecimal(successRate, 1)}%, unit IDs: ${Array.from(unitIds).join(", ") || "none"}.`,
    },
    {
      id: "poc-risk-assessment",
      deliverable: "Risk Assessment Based on Observed Telemetry",
      status: likelyAttackCount > 0 ? "strong" : data.networkEvents.length > 0 ? "partial" : "limited",
      evidence: `${likelyAttackCount} LIKELY_ATTACK events and ${scenarioCoverage} classified behavior categories in this window.`,
    },
    {
      id: "poc-detection-readiness",
      deliverable: "Detection Validation Readiness",
      status: scenarioCoverage >= 4 ? "strong" : scenarioCoverage >= 2 ? "partial" : "limited",
      evidence: `${scenarioCoverage} detection scenarios currently represented (ARP, HTTPS, inbound probe, Modbus baseline, etc.).`,
    },
    {
      id: "poc-identity-depth",
      deliverable: "Downstream OT Identity Depth",
      status: unitIds.size >= 1 ? "partial" : "limited",
      evidence: `${unitIds.size} Power downstream unit IDs observed; friendly OT business names remain mapping-dependent.`,
    },
  ];
}

export function isExternalSourceIp(ip: string) {
  return !isPrivateIPv4Address(ip);
}

export function formatRiskScore(value: number) {
  return formatDecimal(value, 1);
}

export function formatDashboardDatetime(value: string) {
  return formatDateTimeInBangkok(value);
}

export function formatDashboardCompactNumber(value: number) {
  return formatCompactNumber(value, 0);
}

// OT Security Exposure helpers

export const OT_SECURITY_EXPOSURE_KPI_FALLBACK: DashboardKpiCard[] = [
  {
    id: "unknown-host-events",
    title: "Unknown Client Events",
    value: "0",
    helper: "No KPI data in the selected range.",
    trendLabel: "Identity gap",
    tone: "sky",
  },
  {
    id: "likely-attack-events",
    title: "Likely Attack Events",
    value: "0",
    helper: "No KPI data in the selected range.",
    trendLabel: "Threat signal",
    tone: "violet",
  },
  {
    id: "external-source-events",
    title: "External Origin Events",
    value: "0",
    helper: "No KPI data in the selected range.",
    trendLabel: "Ingress exposure",
    tone: "amber",
  },
];

export function buildOtSecurityExposureKpiCards(
  metrics: OtSecurityExposureKpiMetricApiItem[] | undefined,
): DashboardKpiCard[] {
  if (!metrics?.length) {
    return OT_SECURITY_EXPOSURE_KPI_FALLBACK;
  }

  return metrics.map((metric) => ({
    id: metric.id,
    title: metric.title,
    value: metric.value,
    helper: metric.helper,
    trendLabel: metric.trend_label,
    tone: metric.tone,
  }));
}

export function extractSecurityExposureErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as ApiErrorResponse | undefined)?.detail;
    if (typeof detail === "string" && detail.length) {
      return detail;
    }

    const message = (error.response?.data as ApiErrorResponse | undefined)?.error?.message;
    if (typeof message === "string" && message.length) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeDashboardFilterParam(value: string | null): string | undefined {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === "all") {
    return undefined;
  }

  return normalized;
}

export function getLiveSecurityEventFilterQueryParams(searchParams: URLSearchParams): Pick<
  FetchOtSecurityExposureLiveEventsParams,
  "source" | "destination" | "protocol" | "identity" | "severity" | "verdict"
> {
  return {
    source: normalizeDashboardFilterParam(searchParams.get("source")),
    destination: normalizeDashboardFilterParam(searchParams.get("destination")),
    protocol: normalizeDashboardFilterParam(searchParams.get("protocol")),
    identity: normalizeDashboardFilterParam(searchParams.get("identity")),
    severity: normalizeDashboardFilterParam(searchParams.get("severity")),
    verdict: normalizeDashboardFilterParam(searchParams.get("verdict")),
  };
}

const VALID_LIVE_EVENT_ROW_LIMITS = new Set([7, 15, 30, 50]);

export function getLiveSecurityEventRowLimit(searchParams: URLSearchParams): number {
  const rowsFilter = Number(searchParams.get("rows"));
  if (Number.isInteger(rowsFilter) && VALID_LIVE_EVENT_ROW_LIMITS.has(rowsFilter)) {
    return rowsFilter;
  }

  return 7;
}

export function buildOtSecurityExposureSeverityTrendRows(
  rows: OtSecurityExposureEventsOverTimeApiRow[],
): DashboardSeverityTrendRow[] {
  return rows.map((row) => ({
    bucket: formatBucketLabel(row.bucket_start),
    low: row.low,
    medium: row.medium,
    high: row.high,
    critical: row.critical,
  }));
}

export function buildOtSecurityExposureVerdictTrendRows(
  rows: OtSecurityExposureVerdictDistributionApiRow[],
): DashboardVerdictTrendRow[] {
  return rows.map((row) => ({
    bucket: formatBucketLabel(row.bucket_start),
    LIKELY_LEGITIMATE: row.likely_legitimate,
    LIKELY_LEGITIMATE_UNKNOWN_IP: row.likely_legitimate_unknown_ip,
    UNDER_INVESTIGATION: row.under_investigation,
    LIKELY_ATTACK: row.likely_attack,
  }));
}

export function buildOtSecurityExposureTopRiskRows(
  rows: OtSecurityExposureTopRiskySourceApiRow[],
): DashboardRiskSourceRow[] {
  return rows.map((row) => ({
    sourceIp: row.source_ip,
    eventCount: row.event_count,
    avgRiskScore: row.avg_risk_score,
    maxRiskScore: row.max_risk_score,
  }));
}

const OT_SECURITY_KNOWN_PROTOCOLS: DashboardProtocol[] = ["arp", "tcp", "udp", "modbus", "https", "tls", "icmp"];
const OT_SECURITY_KNOWN_SEVERITIES: DashboardSeverity[] = ["low", "medium", "high", "critical"];
const OT_SECURITY_KNOWN_VERDICTS: DashboardVerdict[] = [
  "LIKELY_LEGITIMATE",
  "LIKELY_LEGITIMATE_UNKNOWN_IP",
  "UNDER_INVESTIGATION",
  "LIKELY_ATTACK",
];

function normalizeOtSecurityProtocol(value: string): DashboardProtocol {
  const normalized = value.toLowerCase();
  if (OT_SECURITY_KNOWN_PROTOCOLS.includes(normalized as DashboardProtocol)) {
    return normalized as DashboardProtocol;
  }

  return "tcp";
}

function normalizeOtSecuritySeverity(value: string): DashboardSeverity {
  const normalized = value.toLowerCase();
  if (OT_SECURITY_KNOWN_SEVERITIES.includes(normalized as DashboardSeverity)) {
    return normalized as DashboardSeverity;
  }

  return "low";
}

function normalizeOtSecurityVerdict(value: string): DashboardVerdict {
  const normalized = value.toUpperCase();
  if (OT_SECURITY_KNOWN_VERDICTS.includes(normalized as DashboardVerdict)) {
    return normalized as DashboardVerdict;
  }

  return "UNDER_INVESTIGATION";
}

export function buildOtSecurityExposureLiveEvents(
  rows: OtSecurityExposureLiveEventApiRow[],
): DashboardNetworkEvent[] {
  return rows.map((row) => ({
    id: row.id,
    timestamp: row.event_time,
    sourceIp: row.source_ip,
    destinationIp: row.destination_ip,
    sourceMac: row.source_mac || null,
    destinationMac: row.destination_mac || null,
    sourcePort: row.source_port,
    destinationPort: row.destination_port,
    protocol: normalizeOtSecurityProtocol(row.protocol),
    trafficType: row.traffic_type || "-",
    direction: row.direction || "-",
    classification: row.classification || "-",
    severity: normalizeOtSecuritySeverity(row.severity),
    verdict: normalizeOtSecurityVerdict(row.verdict),
    riskScore: row.risk_score,
    unknownClient: row.unknown_client === 1,
    outsideBusinessHours: row.outside_business_hours === 1,
    modbusDisrupted: row.modbus_disrupted === 1,
    message: row.message || "-",
    rawLog: row.raw_message || "",
  }));
}

// OT Communication Control helpers

const VALID_TOP_FLOW_ROW_LIMITS = new Set([7, 15, 30, 50]);
const OT_COMM_KNOWN_SEVERITIES: DashboardSeverity[] = ["low", "medium", "high", "critical"];

function normalizeOtCommunicationSeverity(value: string): DashboardSeverity {
  const normalized = value.toLowerCase();
  if (OT_COMM_KNOWN_SEVERITIES.includes(normalized as DashboardSeverity)) {
    return normalized as DashboardSeverity;
  }

  return "low";
}

export function extractOtCommunicationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const detail = (error.response?.data as ApiErrorResponse | undefined)?.detail;
    if (typeof detail === "string" && detail.length) {
      return detail;
    }

    const message = (error.response?.data as ApiErrorResponse | undefined)?.error?.message;
    if (typeof message === "string" && message.length) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getTopCommunicationFlowFilterQueryParams(
  searchParams: URLSearchParams,
): Pick<FetchOtCommunicationControlTopFlowsParams, "source" | "destination" | "protocol" | "severity"> {
  return {
    source: normalizeDashboardFilterParam(searchParams.get("flowSource")),
    destination: normalizeDashboardFilterParam(searchParams.get("flowDestination")),
    protocol: normalizeDashboardFilterParam(searchParams.get("flowProtocol")),
    severity: normalizeDashboardFilterParam(searchParams.get("flowSeverity")),
  };
}

export function getTopCommunicationFlowRowLimit(searchParams: URLSearchParams): number {
  const rowsFilter = Number(searchParams.get("flowRows"));
  if (Number.isInteger(rowsFilter) && VALID_TOP_FLOW_ROW_LIMITS.has(rowsFilter)) {
    return rowsFilter;
  }

  return 7;
}

export function formatOtCommunicationBucketLabel(bucketIso: string): string {
  return formatBucketLabel(bucketIso);
}

export function buildOtCommunicationTopFlowRows(
  rows: OtCommunicationTopFlowApiRow[],
): DashboardFlowTableRow[] {
  return rows.map((row) => ({
    sourceIp: row.source_ip,
    destinationIp: row.destination_ip,
    protocol: row.protocol || "-",
    port: row.port || "-",
    direction: row.direction || "-",
    eventCount: row.event_count,
    unknownClientEvents: row.unknown_client_events,
    unknownClientRate: row.unknown_client_rate ?? 0,
    avgRiskScore: row.avg_risk_score,
    maxRiskScore: row.max_risk_score ?? 0,
    highestSeverity: normalizeOtCommunicationSeverity(row.highest_severity),
    likelyAttackEvents: row.likely_attack_events ?? 0,
    outsideHoursEvents: row.outside_hours_events ?? 0,
    outsideHoursRate: row.outside_hours_rate ?? 0,
    modbusDisruptedEvents: row.modbus_disrupted_events ?? 0,
    modbusDisruptedRate: row.modbus_disrupted_rate ?? 0,
    firstSeen: row.first_seen || row.last_seen,
    lastSeen: row.last_seen,
  }));
}

export function buildOtCommunicationSmartloggerTopologyRows(
  rows: OtCommunicationSmartloggerTopologyApiRow[],
): DashboardSmartloggerTopologyRow[] {
  return rows.map((row) => ({
    gatewayHost: row.gateway_host || "-",
    smartloggerIp: row.smartlogger_ip || "0.0.0.0",
    smartloggerPort: row.smartlogger_port || 502,
    unitId: row.unit_id,
    deviceType: (row.device_type || "unknown").toLowerCase(),
    deviceName: row.device_name || `Unit ${row.unit_id}`,
    totalRequests: row.total_requests ?? 0,
    successCount: row.success_count ?? 0,
    errorCount: row.error_count ?? 0,
    slowCount: row.slow_count ?? 0,
    successRate: row.success_rate ?? 0,
    avgResponseTimeMs: row.avg_response_time_ms ?? 0,
    maxResponseTimeMs: row.max_response_time_ms ?? 0,
    protocols: row.protocols || "modbus_tcp",
    lastSeen: row.last_seen,
  }));
}

import {
  DEMO_ASSET_IPS,
  DEMO_ASSET_MACS,
  DEMO_CUSTOMER_NAME,
  DEMO_ENVIRONMENT_NAME,
  DEMO_SITE_NAME,
} from "./demo-config";

type MockHttpMethod = "get" | "post" | "put" | "patch" | "delete";
type MockRequestConfig = { params?: Record<string, unknown> };
type MockResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: MockRequestConfig;
};

type DemoState = {
  sessionUserId: number | null;
  users: UserManagementApiUserRow[];
  ports: PortItem[];
  notifications: MockNotificationRow[];
  rules: DetectionRuleApiRow[];
  allowlists: DetectionAllowlistApiRow[];
  deviceMappings: DetectionDeviceNameMappingApiRow[];
  notificationPolicies: DetectionNotificationPolicyApiRow[];
  incidentStatuses: Record<string, DetectionIncidentApiRow["status"]>;
};

type MockNotificationRow = {
  id: number;
  title: string;
  content: string;
  status: "SENT" | "READ";
  created_at: string;
  updated_at: string;
};

type DemoNetworkAsset = {
  key: string;
  name: string;
  ip: string;
  mac: string | null;
  type: string;
  visibility: "direct" | "external" | "logical";
};

type DemoSecurityEventSeed = {
  id: string;
  event_time: string;
  source_ip: string;
  destination_ip: string;
  source_mac: string | null;
  destination_mac: string | null;
  source_port: number | null;
  destination_port: number | null;
  protocol: string;
  traffic_type: string;
  direction: string;
  classification: string;
  severity: "low" | "medium" | "high" | "critical";
  verdict: "LIKELY_LEGITIMATE" | "LIKELY_LEGITIMATE_UNKNOWN_IP" | "UNDER_INVESTIGATION" | "LIKELY_ATTACK";
  risk_score: number;
  unknown_client: 0 | 1;
  outside_business_hours: 0 | 1;
  modbus_disrupted: 0 | 1;
  message: string;
  raw_message: string;
  ruleIds: number[];
};

const STORAGE_KEY = "zcrot-demo-state-v2";
const DEMO_ADMIN_USER_ID = 1;
const PAGE_DEFAULT_LIMIT = 50;

const NETWORK_ASSETS: DemoNetworkAsset[] = [
  {
    key: "router",
    name: "Router",
    ip: DEMO_ASSET_IPS.router,
    mac: DEMO_ASSET_MACS.router,
    type: "network_infrastructure",
    visibility: "direct",
  },
  {
    key: "coreSwitch",
    name: "Core Switch",
    ip: DEMO_ASSET_IPS.coreSwitch,
    mac: DEMO_ASSET_MACS.coreSwitch,
    type: "network_infrastructure",
    visibility: "direct",
  },
  {
    key: "otGateway",
    name: "OT Gateway / Smart Logger / Unit 0",
    ip: DEMO_ASSET_IPS.otGateway,
    mac: DEMO_ASSET_MACS.otGateway,
    type: "ot_gateway",
    visibility: "direct",
  },
  {
    key: "industrialCloudGateway",
    name: "Industrial Cloud Gateway",
    ip: DEMO_ASSET_IPS.industrialCloudGateway,
    mac: DEMO_ASSET_MACS.industrialCloudGateway,
    type: "cloud_gateway",
    visibility: "direct",
  },
  {
    key: "evCharger",
    name: "EV Charger",
    ip: DEMO_ASSET_IPS.evCharger,
    mac: DEMO_ASSET_MACS.evCharger,
    type: "ev_charger",
    visibility: "direct",
  },
  {
    key: "engineeringWorkstation",
    name: "Engineering Workstation",
    ip: DEMO_ASSET_IPS.engineeringWorkstation,
    mac: DEMO_ASSET_MACS.engineeringWorkstation,
    type: "workstation",
    visibility: "direct",
  },
];

const LOGICAL_OT_UNITS = [
  { unitId: 0, name: "OT Gateway / Smart Logger / Unit 0", type: "gateway_diagnostics" },
  { unitId: 1, name: "Unit 1 = Solar Inverter", type: "solar_inverter" },
  { unitId: 11, name: "Unit 11 = Power Meter", type: "power_meter" },
  { unitId: 100, name: "Unit 100 = Environmental Sensor", type: "environmental_sensor" },
];

class MockHttpError extends Error {
  response: { status: number; data: ApiErrorResponse };

  constructor(status: number, message: string) {
    super(message);
    this.name = "MockHttpError";
    this.response = {
      status,
      data: {
        detail: message,
        error: {
          code: status === 404 ? "NOT_FOUND" : "MOCK_ERROR",
          message,
          status_code: status,
        },
      },
    };
  }
}

const isoMinutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const isoHoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60_000).toISOString();
const nowIso = () => new Date().toISOString();

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringParam(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function buildResponse<T>(data: T, config: MockRequestConfig, status = 200): MockResponse<T> {
  return {
    data: clone(data),
    status,
    statusText: status >= 400 ? "Error" : "OK",
    headers: {},
    config,
  };
}

async function withDelay<T>(response: MockResponse<T>): Promise<MockResponse<T>> {
  const delayMs = 120 + Math.floor(Math.random() * 180);
  await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  return response;
}

function normalizePath(rawUrl: string): string {
  const url = new URL(rawUrl, "http://localhost");
  const path = url.pathname
    .replace(/^\/api\/v1\/?/, "/")
    .replace(/\/+$/, "");
  return path || "/";
}

function readUrlParams(rawUrl: string, config?: MockRequestConfig): Record<string, unknown> {
  const url = new URL(rawUrl, "http://localhost");
  const urlParams = Object.fromEntries(url.searchParams.entries());
  return {
    ...urlParams,
    ...(config?.params ?? {}),
  };
}

function createInitialState(): DemoState {
  const createdAt = isoHoursAgo(240);
  const updatedAt = isoHoursAgo(4);

  return {
    sessionUserId: null,
    users: [
      {
        id: DEMO_ADMIN_USER_ID,
        username: "demo.admin",
        email: "demo.admin@abc-industrial.example",
        role: "admin",
        status: "active",
        notification_enabled: true,
        last_login: isoMinutesAgo(18),
        created_at: createdAt,
        updated_at: updatedAt,
      },
      {
        id: 2,
        username: "ot.analyst",
        email: "ot.analyst@abc-industrial.example",
        role: "user",
        status: "active",
        notification_enabled: true,
        last_login: isoHoursAgo(9),
        created_at: createdAt,
        updated_at: updatedAt,
      },
      {
        id: 3,
        username: "demo.viewer",
        email: "demo.viewer@abc-industrial.example",
        role: "viewer",
        status: "pending_verification",
        notification_enabled: false,
        last_login: null,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ],
    ports: [
      buildPort(1, 5514, "OT Gateway syslog", "Gateway/controller telemetry input", true, true, 8450),
      buildPort(2, 5515, "Network sensor mirror", "Passive OT communication metadata", true, false, 5232),
      buildPort(3, 5516, "EV charger events", "EVSE session and status messages", true, false, 984),
      buildPort(4, 5517, "Spare demo input", "Reserved for workshop scenarios", false, false, 0),
    ],
    notifications: [
      {
        id: 1,
        title: "Unknown client investigation opened",
        content: `${DEMO_ASSET_IPS.unknownClient} attempted Modbus/TCP access to the OT Gateway outside the normal baseline.`,
        status: "SENT",
        created_at: isoMinutesAgo(24),
        updated_at: isoMinutesAgo(24),
      },
      {
        id: 2,
        title: "Coverage reminder",
        content: "Downstream Unit 1, Unit 11, and Unit 100 are visible through gateway telemetry as logical OT entities.",
        status: "READ",
        created_at: isoHoursAgo(6),
        updated_at: isoHoursAgo(5),
      },
      {
        id: 3,
        title: "Remote maintenance review",
        content: "A remote maintenance endpoint matched the after-hours detection rule and is waiting for analyst closure.",
        status: "SENT",
        created_at: isoHoursAgo(13),
        updated_at: isoHoursAgo(13),
      },
    ],
    rules: buildInitialRules(createdAt, updatedAt),
    allowlists: buildInitialAllowlists(createdAt, updatedAt),
    deviceMappings: buildInitialDeviceMappings(createdAt, updatedAt),
    notificationPolicies: buildInitialNotificationPolicies(createdAt, updatedAt),
    incidentStatuses: {
      "INC-ABC-UNKNOWN-MODBUS": "open",
      "INC-ABC-REMOTE-MAINT": "ack",
      "INC-ABC-MODBUS-DEGRADED": "open",
      "INC-ABC-CLOUD-DEVIATION": "closed",
    },
  };
}

function buildPort(
  id: number,
  portNumber: number,
  label: string,
  description: string,
  isActive: boolean,
  isPrimary: boolean,
  logsReceivedCount: number,
): PortItem {
  return {
    id,
    port_number: portNumber,
    label,
    description,
    failover_ports: isPrimary ? [5515] : [],
    is_active: isActive,
    is_primary: isPrimary,
    status: isActive ? "ACTIVE" : "INACTIVE",
    last_activity: logsReceivedCount > 0 ? isoMinutesAgo(id * 5) : null,
    error_message: null,
    logs_received_count: logsReceivedCount,
    created_at: isoHoursAgo(120),
    updated_at: isoMinutesAgo(id * 7),
  };
}

function buildInitialRules(createdAt: string, updatedAt: string): DetectionRuleApiRow[] {
  return [
    {
      id: 1,
      name: "Unknown Client Access to OT Gateway",
      description: "Flags unmapped clients attempting OT control or gateway services.",
      rule_type: "single_event",
      logical_operator: "AND",
      conditions: [
        { field: "unknown_client", operator: "equals", value: true },
        { field: "destination_ip", operator: "equals", value: DEMO_ASSET_IPS.otGateway },
      ],
      action_severity: "HIGH",
      priority: 95,
      run_mode: "active",
      is_active: true,
      allowlist_mode: "apply",
      override_on_high_confidence: true,
      time_window_seconds: null,
      threshold_count: null,
      aggregation_field: null,
      aggregation_function: null,
      group_by_fields: ["source_ip", "destination_ip"],
      dedup_window_seconds: 900,
      tags: ["unknown-client", "modbus", "gateway"],
      created_by_user_id: 1,
      version: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 2,
      name: "After-Hours Remote Maintenance",
      description: "Detects remote maintenance activity outside the approved maintenance window.",
      rule_type: "threshold",
      logical_operator: "AND",
      conditions: [
        { field: "source_ip", operator: "equals", value: DEMO_ASSET_IPS.remoteMaintenance },
        { field: "outside_business_hours", operator: "equals", value: true },
      ],
      action_severity: "CRITICAL",
      priority: 100,
      run_mode: "active",
      is_active: true,
      allowlist_mode: "apply",
      override_on_high_confidence: true,
      time_window_seconds: 3600,
      threshold_count: 2,
      aggregation_field: "source_ip",
      aggregation_function: "count",
      group_by_fields: ["source_ip", "destination_ip"],
      dedup_window_seconds: 1800,
      tags: ["remote-access", "maintenance"],
      created_by_user_id: 1,
      version: 2,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 3,
      name: "Modbus Polling Error Burst",
      description: "Detects unit polling errors or slow responses through the OT Gateway.",
      rule_type: "aggregation",
      logical_operator: "OR",
      conditions: [
        { field: "modbus_disrupted", operator: "equals", value: true },
        { field: "risk_score", operator: "greater_than", value: 60 },
      ],
      action_severity: "MEDIUM",
      priority: 70,
      run_mode: "active",
      is_active: true,
      allowlist_mode: "apply",
      override_on_high_confidence: false,
      time_window_seconds: 1800,
      threshold_count: 3,
      aggregation_field: "unit_id",
      aggregation_function: "count",
      group_by_fields: ["destination_ip"],
      dedup_window_seconds: 1800,
      tags: ["modbus", "baseline"],
      created_by_user_id: 1,
      version: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 4,
      name: "Cloud Egress Baseline Deviation",
      description: "Highlights unusual cloud egress volume or destination changes from gateway assets.",
      rule_type: "correlation",
      logical_operator: "AND",
      conditions: [
        { field: "direction", operator: "equals", value: "external" },
        { field: "classification", operator: "contains", value: "cloud" },
      ],
      action_severity: "MEDIUM",
      priority: 60,
      run_mode: "shadow",
      is_active: true,
      allowlist_mode: "apply",
      override_on_high_confidence: false,
      time_window_seconds: 7200,
      threshold_count: 6,
      aggregation_field: "destination_ip",
      aggregation_function: "count",
      group_by_fields: ["source_ip", "destination_ip"],
      dedup_window_seconds: 3600,
      tags: ["cloud", "baseline"],
      created_by_user_id: 1,
      version: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 5,
      name: "EV Charger Session Anomaly",
      description: "Monitors charging station communication outside the expected cloud path.",
      rule_type: "single_event",
      logical_operator: "AND",
      conditions: [
        { field: "source_ip", operator: "equals", value: DEMO_ASSET_IPS.evCharger },
        { field: "destination_ip", operator: "not_equals", value: DEMO_ASSET_IPS.industrialCloudGateway },
      ],
      action_severity: "LOW",
      priority: 40,
      run_mode: "shadow",
      is_active: true,
      allowlist_mode: "apply",
      override_on_high_confidence: false,
      time_window_seconds: null,
      threshold_count: null,
      aggregation_field: null,
      aggregation_function: null,
      group_by_fields: ["source_ip"],
      dedup_window_seconds: 3600,
      tags: ["ev-charger", "cloud"],
      created_by_user_id: 1,
      version: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
  ];
}

function buildInitialAllowlists(createdAt: string, updatedAt: string): DetectionAllowlistApiRow[] {
  return [
    {
      id: 1,
      name: "Approved cloud telemetry path",
      description: "Industrial Cloud Gateway to the fictional cloud endpoint.",
      is_active: true,
      source_ip: DEMO_ASSET_IPS.industrialCloudGateway,
      source_cidr: null,
      destination_ip: DEMO_ASSET_IPS.externalCloud,
      destination_cidr: null,
      direction: "external",
      protocol: "tls",
      destination_port_start: 443,
      destination_port_end: 443,
      classification: "cloud_telemetry",
      scenario_type: "normal_operations",
      enabled_start_at: null,
      enabled_end_at: null,
      max_matches_per_hour: 240,
      notes: "Demo-only allowlist for expected industrial cloud telemetry.",
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 2,
      name: "Engineering workstation to gateway",
      description: "Known engineering workstation used for read-only OT checks.",
      is_active: true,
      source_ip: DEMO_ASSET_IPS.engineeringWorkstation,
      source_cidr: null,
      destination_ip: DEMO_ASSET_IPS.otGateway,
      destination_cidr: null,
      direction: "internal",
      protocol: "modbus",
      destination_port_start: 502,
      destination_port_end: 502,
      classification: "engineering_read_only",
      scenario_type: "maintenance",
      enabled_start_at: null,
      enabled_end_at: null,
      max_matches_per_hour: 60,
      notes: "Limited to planned maintenance demonstrations.",
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 3,
      name: "NTP time synchronization",
      description: "Gateway and network devices to documentation-range NTP peers.",
      is_active: true,
      source_ip: null,
      source_cidr: "10.40.20.0/24",
      destination_ip: DEMO_ASSET_IPS.ntpPrimary,
      destination_cidr: null,
      direction: "external",
      protocol: "udp",
      destination_port_start: 123,
      destination_port_end: 123,
      classification: "ntp",
      scenario_type: "infrastructure",
      enabled_start_at: null,
      enabled_end_at: null,
      max_matches_per_hour: 120,
      notes: "Fictional NTP endpoint in documentation address space.",
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
  ];
}

function buildInitialDeviceMappings(createdAt: string, updatedAt: string): DetectionDeviceNameMappingApiRow[] {
  const networkMappings = NETWORK_ASSETS.map((asset, index) => ({
    id: index + 1,
    mapping_type: "ip" as const,
    ip_address: asset.ip,
    unit_id: null,
    display_name: asset.name,
    description: `${asset.type.replaceAll("_", " ")} with direct Ethernet/IP visibility in ${DEMO_SITE_NAME}.`,
    is_active: true,
    created_by_user_id: 1,
    created_at: createdAt,
    updated_at: updatedAt,
  }));

  const logicalMappings = LOGICAL_OT_UNITS
    .filter((unit) => unit.unitId !== 0)
    .map((unit, index) => ({
      id: networkMappings.length + index + 1,
      mapping_type: "modbus_unit" as const,
      ip_address: null,
      unit_id: unit.unitId,
      display_name: `${unit.name} (logical unit via OT Gateway)`,
      description: "Gateway-managed downstream OT entity identified through unit telemetry, not direct Ethernet/IP visibility.",
      is_active: true,
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    }));

  return [...networkMappings, ...logicalMappings];
}

function buildInitialNotificationPolicies(createdAt: string, updatedAt: string): DetectionNotificationPolicyApiRow[] {
  return [
    {
      id: 1,
      name: "High severity UI notification",
      description: "Notify analysts for high and critical demo detections.",
      is_active: true,
      channel: "ui",
      min_severity: "HIGH",
      event_type: "detection_match",
      target: null,
      throttle_seconds: 300,
      template: { title: "High severity detection", demo: true },
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    {
      id: 2,
      name: "Daily posture digest",
      description: "Simulated daily visibility and incident digest.",
      is_active: true,
      channel: "email",
      min_severity: "MEDIUM",
      event_type: "incident_summary",
      target: "ot.security@abc-industrial.example",
      throttle_seconds: 86400,
      template: { title: "zcrOT demo digest", demo: true },
      created_by_user_id: 1,
      created_at: createdAt,
      updated_at: updatedAt,
    },
  ];
}

function getState(): DemoState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    const initial = createInitialState();
    return {
      ...initial,
      ...parsed,
      users: parsed.users?.length ? parsed.users : initial.users,
      ports: parsed.ports?.length ? parsed.ports : initial.ports,
      notifications: parsed.notifications?.length ? parsed.notifications : initial.notifications,
      rules: parsed.rules?.length ? parsed.rules : initial.rules,
      allowlists: parsed.allowlists?.length ? parsed.allowlists : initial.allowlists,
      deviceMappings: parsed.deviceMappings?.length ? parsed.deviceMappings : initial.deviceMappings,
      notificationPolicies: parsed.notificationPolicies?.length ? parsed.notificationPolicies : initial.notificationPolicies,
      incidentStatuses: { ...initial.incidentStatuses, ...(parsed.incidentStatuses ?? {}) },
    };
  } catch {
    const initial = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveState(state: DemoState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function mutateState<T>(mutator: (state: DemoState) => T): T {
  const state = getState();
  const result = mutator(state);
  saveState(state);
  return result;
}

function getCurrentUser(state = getState()): User {
  const user = state.users.find((item) => item.id === (state.sessionUserId ?? DEMO_ADMIN_USER_ID)) ?? state.users[0];
  return {
    ...user,
    permissions: user.role === "admin"
      ? ["dashboard:read", "rules:write", "users:write", "reports:export"]
      : ["dashboard:read", "reports:export"],
  };
}

function getTimeWindow(params: Record<string, unknown>) {
  const timeRange = String(params.timeRange ?? "1h") as PowerMonitoringQueryTimeRange;
  if (timeRange === "custom") {
    const customStart = toStringParam(params.customStart);
    const customEnd = toStringParam(params.customEnd);
    const start = customStart ? new Date(customStart) : new Date(Date.now() - 60 * 60_000);
    const end = customEnd ? new Date(customEnd) : new Date();
    return { start, end, timeRange, customStart: customStart ?? null, customEnd: customEnd ?? null };
  }

  const minutesByRange: Record<string, number> = {
    "1h": 60,
    "3h": 180,
    "24h": 1440,
    "3d": 4320,
    "7d": 10080,
  };
  const end = new Date();
  const start = new Date(end.getTime() - (minutesByRange[timeRange] ?? 60) * 60_000);
  return { start, end, timeRange, customStart: null, customEnd: null };
}

function buildBuckets(params: Record<string, unknown>, maxPoints = 24): Date[] {
  const { start, end } = getTimeWindow(params);
  const spanMs = Math.max(end.getTime() - start.getTime(), 60_000);
  const count = Math.max(6, Math.min(maxPoints, Math.ceil(spanMs / (5 * 60_000))));
  const stepMs = spanMs / count;
  return Array.from({ length: count + 1 }, (_, index) => new Date(start.getTime() + stepMs * index));
}

function bucketMinutes(params: Record<string, unknown>, maxPoints = 24): number {
  const buckets = buildBuckets(params, maxPoints);
  if (buckets.length < 2) {
    return 5;
  }
  return Math.max(1, Math.round((buckets[1].getTime() - buckets[0].getTime()) / 60_000));
}

function isOutsideBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  return hour < 7 || hour >= 19;
}

function sourceMac(ip: string): string | null {
  const asset = NETWORK_ASSETS.find((item) => item.ip === ip);
  if (asset) {
    return asset.mac;
  }

  if (ip === DEMO_ASSET_IPS.unknownClient) {
    return DEMO_ASSET_MACS.unknownClient;
  }

  return null;
}

function makeEvent(
  id: string,
  minutesAgo: number,
  sourceIp: string,
  destinationIp: string,
  protocol: string,
  destinationPort: number | null,
  classification: string,
  severity: DemoSecurityEventSeed["severity"],
  verdict: DemoSecurityEventSeed["verdict"],
  riskScore: number,
  message: string,
  ruleIds: number[] = [],
  options: Partial<Pick<DemoSecurityEventSeed, "source_port" | "traffic_type" | "direction" | "unknown_client" | "outside_business_hours" | "modbus_disrupted">> = {},
): DemoSecurityEventSeed {
  const eventDate = new Date(Date.now() - minutesAgo * 60_000);
  const sourcePort = options.source_port ?? (destinationPort ? 42000 + (minutesAgo % 4000) : null);
  const direction = options.direction ?? (
    sourceIp.startsWith("10.") && destinationIp.startsWith("10.")
      ? "internal"
      : sourceIp.startsWith("10.")
        ? "external"
        : "inbound"
  );
  const unknownClient = options.unknown_client ?? (sourceIp === DEMO_ASSET_IPS.unknownClient ? 1 : 0);
  const outsideHours = options.outside_business_hours ?? (isOutsideBusinessHours(eventDate) ? 1 : 0);
  const rawMessage = [
    `event=${id}`,
    `site="${DEMO_SITE_NAME}"`,
    `src=${sourceIp}`,
    `dst=${destinationIp}`,
    `proto=${protocol}`,
    destinationPort ? `dpt=${destinationPort}` : "",
    `classification=${classification}`,
    `risk=${riskScore}`,
  ].filter(Boolean).join(" ");

  return {
    id,
    event_time: eventDate.toISOString(),
    source_ip: sourceIp,
    destination_ip: destinationIp,
    source_mac: sourceMac(sourceIp),
    destination_mac: sourceMac(destinationIp),
    source_port: sourcePort,
    destination_port: destinationPort,
    protocol,
    traffic_type: options.traffic_type ?? "session",
    direction,
    classification,
    severity,
    verdict,
    risk_score: riskScore,
    unknown_client: unknownClient,
    outside_business_hours: outsideHours,
    modbus_disrupted: options.modbus_disrupted ?? 0,
    message,
    raw_message: rawMessage,
    ruleIds,
  };
}

function generateSecurityEvents(): DemoSecurityEventSeed[] {
  const events: DemoSecurityEventSeed[] = [];

  for (let index = 0; index < 168; index += 1) {
    const minutesAgo = index * 15;
    events.push(makeEvent(
      `evt-cloud-${index}`,
      minutesAgo + 2,
      DEMO_ASSET_IPS.industrialCloudGateway,
      DEMO_ASSET_IPS.externalCloud,
      "tls",
      443,
      "cloud_telemetry",
      "low",
      "LIKELY_LEGITIMATE",
      18 + (index % 6),
      "Approved industrial cloud telemetry from the site cloud gateway.",
      [],
      { traffic_type: "cloud_sync" },
    ));

    if (index % 2 === 0) {
      events.push(makeEvent(
        `evt-gw-cloud-${index}`,
        minutesAgo + 5,
        DEMO_ASSET_IPS.otGateway,
        DEMO_ASSET_IPS.industrialCloudGateway,
        "https",
        443,
        "gateway_to_cloud_gateway",
        "low",
        "LIKELY_LEGITIMATE",
        20 + (index % 5),
        "OT Gateway forwarded telemetry to the Industrial Cloud Gateway.",
        [],
        { traffic_type: "gateway_telemetry" },
      ));
    }

    if (index % 3 === 0) {
      events.push(makeEvent(
        `evt-ev-${index}`,
        minutesAgo + 8,
        DEMO_ASSET_IPS.evCharger,
        DEMO_ASSET_IPS.industrialCloudGateway,
        "https",
        443,
        "ev_charger_cloud_session",
        "low",
        "LIKELY_LEGITIMATE",
        16 + (index % 7),
        "EV Charger maintained expected cloud gateway session.",
        [],
        { traffic_type: "evse_status" },
      ));
    }

    if (index % 4 === 0) {
      events.push(makeEvent(
        `evt-eng-${index}`,
        minutesAgo + 11,
        DEMO_ASSET_IPS.engineeringWorkstation,
        DEMO_ASSET_IPS.otGateway,
        "modbus",
        502,
        "engineering_read_only",
        "low",
        "LIKELY_LEGITIMATE",
        24 + (index % 9),
        "Engineering Workstation performed expected read-only gateway check.",
        [],
        { traffic_type: "ot_control", direction: "internal" },
      ));
    }

    if (index % 2 === 0) {
      events.push(makeEvent(
        `evt-router-gw-health-${index}`,
        minutesAgo + 3,
        DEMO_ASSET_IPS.router,
        DEMO_ASSET_IPS.otGateway,
        "icmp",
        null,
        "infrastructure_health_check",
        "low",
        "LIKELY_LEGITIMATE",
        12 + (index % 4),
        "Router reachability check observed against the OT Gateway.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));

      events.push(makeEvent(
        `evt-gw-router-snmp-${index}`,
        minutesAgo + 6,
        DEMO_ASSET_IPS.otGateway,
        DEMO_ASSET_IPS.router,
        "udp",
        161,
        "network_management_poll",
        "low",
        "LIKELY_LEGITIMATE",
        15 + (index % 5),
        "OT Gateway collected network health metadata from the Router.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));
    }

    if (index % 3 === 0) {
      events.push(makeEvent(
        `evt-switch-gw-lldp-${index}`,
        minutesAgo + 4,
        DEMO_ASSET_IPS.coreSwitch,
        DEMO_ASSET_IPS.otGateway,
        "lldp",
        null,
        "switch_neighbor_visibility",
        "low",
        "LIKELY_LEGITIMATE",
        11 + (index % 4),
        "Core Switch neighbor telemetry associated the OT Gateway with the monitored switch port.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));

      events.push(makeEvent(
        `evt-gw-switch-snmp-${index}`,
        minutesAgo + 9,
        DEMO_ASSET_IPS.otGateway,
        DEMO_ASSET_IPS.coreSwitch,
        "udp",
        161,
        "switch_port_status_poll",
        "low",
        "LIKELY_LEGITIMATE",
        17 + (index % 5),
        "OT Gateway polled Core Switch port status for passive visibility correlation.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));
    }

    if (index % 4 === 0) {
      events.push(makeEvent(
        `evt-ev-dns-${index}`,
        minutesAgo + 12,
        DEMO_ASSET_IPS.evCharger,
        DEMO_ASSET_IPS.router,
        "udp",
        53,
        "ev_charger_dns_lookup",
        "low",
        "LIKELY_LEGITIMATE",
        19 + (index % 4),
        "EV Charger resolved its approved cloud service through the local Router.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));

      events.push(makeEvent(
        `evt-cloudgw-dns-${index}`,
        minutesAgo + 13,
        DEMO_ASSET_IPS.industrialCloudGateway,
        DEMO_ASSET_IPS.router,
        "udp",
        53,
        "cloud_gateway_dns_lookup",
        "low",
        "LIKELY_LEGITIMATE",
        18 + (index % 5),
        "Industrial Cloud Gateway resolved telemetry service endpoints through the local Router.",
        [],
        { traffic_type: "infrastructure", direction: "internal" },
      ));
    }

    if (index % 8 === 0) {
      events.push(makeEvent(
        `evt-ntp-${index}`,
        minutesAgo + 14,
        DEMO_ASSET_IPS.otGateway,
        index % 16 === 0 ? DEMO_ASSET_IPS.ntpPrimary : DEMO_ASSET_IPS.ntpSecondary,
        "udp",
        123,
        "ntp",
        "low",
        "LIKELY_LEGITIMATE",
        10,
        "Gateway time synchronization to approved documentation-range NTP endpoint.",
        [],
        { traffic_type: "infrastructure" },
      ));
    }
  }

  const suspiciousSeeds = [
    { minutes: 18, score: 86, severity: "high" as const, verdict: "LIKELY_ATTACK" as const },
    { minutes: 39, score: 78, severity: "high" as const, verdict: "UNDER_INVESTIGATION" as const },
    { minutes: 312, score: 82, severity: "high" as const, verdict: "LIKELY_ATTACK" as const },
    { minutes: 914, score: 74, severity: "medium" as const, verdict: "UNDER_INVESTIGATION" as const },
  ];
  suspiciousSeeds.forEach((seed, index) => {
    events.push(makeEvent(
      `evt-unknown-modbus-${index}`,
      seed.minutes,
      DEMO_ASSET_IPS.unknownClient,
      DEMO_ASSET_IPS.otGateway,
      "modbus",
      502,
      "unknown_client_gateway_access",
      seed.severity,
      seed.verdict,
      seed.score,
      "Unknown client attempted Modbus/TCP access to the OT Gateway.",
      [1],
      { traffic_type: "ot_control", direction: "internal", unknown_client: 1, outside_business_hours: 1 },
    ));
  });

  [92, 138, 806].forEach((minutes, index) => {
    events.push(makeEvent(
      `evt-remote-maint-${index}`,
      minutes,
      DEMO_ASSET_IPS.remoteMaintenance,
      DEMO_ASSET_IPS.industrialCloudGateway,
      "tls",
      8443,
      "remote_maintenance",
      index === 0 ? "critical" : "high",
      "UNDER_INVESTIGATION",
      index === 0 ? 91 : 79,
      "Remote maintenance endpoint connected outside the approved demo maintenance window.",
      [2],
      { traffic_type: "remote_access", direction: "inbound", outside_business_hours: 1 },
    ));
  });

  [22, 52, 104, 248].forEach((minutes, index) => {
    events.push(makeEvent(
      `evt-remote-gateway-review-${index}`,
      minutes,
      DEMO_ASSET_IPS.remoteMaintenance,
      DEMO_ASSET_IPS.otGateway,
      "tls",
      443,
      "remote_gateway_review",
      index === 0 ? "high" : "medium",
      "UNDER_INVESTIGATION",
      index === 0 ? 82 : 67,
      "Remote maintenance endpoint reached the OT Gateway management interface for review.",
      [2],
      { traffic_type: "remote_access", direction: "inbound", outside_business_hours: 1 },
    ));
  });

  [29, 57, 391].forEach((minutes, index) => {
    events.push(makeEvent(
      `evt-unknown-cloudgw-${index}`,
      minutes,
      DEMO_ASSET_IPS.unknownClient,
      DEMO_ASSET_IPS.industrialCloudGateway,
      "tcp",
      22,
      "unknown_client_cloud_gateway_probe",
      index === 0 ? "high" : "medium",
      "UNDER_INVESTIGATION",
      index === 0 ? 81 : 64,
      "Unknown client probed the Industrial Cloud Gateway service surface.",
      [1],
      { traffic_type: "reconnaissance", direction: "internal", unknown_client: 1, outside_business_hours: 1 },
    ));
  });

  [47, 62, 77, 492, 507].forEach((minutes, index) => {
    events.push(makeEvent(
      `evt-modbus-degraded-${index}`,
      minutes,
      DEMO_ASSET_IPS.otGateway,
      DEMO_ASSET_IPS.otGateway,
      "modbus",
      502,
      "modbus_polling_degradation",
      "medium",
      "UNDER_INVESTIGATION",
      62 + index,
      "Gateway telemetry reported slow or failed polling for a downstream logical OT unit.",
      [3],
      { traffic_type: "gateway_telemetry", direction: "internal", modbus_disrupted: 1 },
    ));
  });

  [126, 156, 186, 216].forEach((minutes, index) => {
    events.push(makeEvent(
      `evt-cloud-deviation-${index}`,
      minutes,
      DEMO_ASSET_IPS.industrialCloudGateway,
      DEMO_ASSET_IPS.externalCloud,
      "tls",
      443,
      "cloud_egress_baseline_deviation",
      "medium",
      "UNDER_INVESTIGATION",
      58 + index,
      "Cloud telemetry volume exceeded the normal short-window baseline.",
      [4],
      { traffic_type: "cloud_sync", direction: "external" },
    ));
  });

  return events.sort((left, right) => +new Date(right.event_time) - +new Date(left.event_time));
}

function filterEvents(params: Record<string, unknown>): DemoSecurityEventSeed[] {
  const { start, end } = getTimeWindow(params);
  const source = toStringParam(params.source)?.toLowerCase();
  const destination = toStringParam(params.destination)?.toLowerCase();
  const protocol = toStringParam(params.protocol)?.toLowerCase();
  const severity = toStringParam(params.severity)?.toLowerCase();
  const verdict = toStringParam(params.verdict)?.toUpperCase();
  const identity = toStringParam(params.identity)?.toLowerCase();

  return generateSecurityEvents().filter((event) => {
    const eventTime = new Date(event.event_time);
    if (eventTime < start || eventTime > end) return false;
    if (source && !event.source_ip.toLowerCase().includes(source)) return false;
    if (destination && !event.destination_ip.toLowerCase().includes(destination)) return false;
    if (protocol && event.protocol.toLowerCase() !== protocol) return false;
    if (severity && event.severity.toLowerCase() !== severity) return false;
    if (verdict && event.verdict !== verdict) return false;
    if (identity === "known" && event.unknown_client === 1) return false;
    if (identity === "unknown" && event.unknown_client !== 1) return false;
    return true;
  });
}

function paginate<T>(rows: T[], params: Record<string, unknown>, defaultLimit = PAGE_DEFAULT_LIMIT) {
  const offset = Math.max(0, toNumber(params.offset ?? params.skip, 0));
  const limit = Math.max(1, toNumber(params.limit, defaultLimit));
  const pageRows = rows.slice(offset, offset + limit);
  return {
    rows: pageRows,
    total: rows.length,
    page: Math.floor(offset / limit) + 1,
    per_page: limit,
    has_more: offset + limit < rows.length,
  };
}

function aggregateTopFlows(events: DemoSecurityEventSeed[]): OtCommunicationTopFlowApiRow[] {
  const grouped = new Map<string, OtCommunicationTopFlowApiRow & { riskSamples: number[]; severityRank: number; first: number; last: number }>();
  const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

  events.forEach((event) => {
    const key = [event.source_ip, event.destination_ip, event.protocol, event.destination_port ?? "-", event.direction].join("|");
    const eventTime = +new Date(event.event_time);
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        source_ip: event.source_ip,
        destination_ip: event.destination_ip,
        protocol: event.protocol.toUpperCase(),
        port: event.destination_port ? String(event.destination_port) : "-",
        direction: event.direction === "external" || event.direction === "inbound" ? "external" : "internal",
        event_count: 1,
        unknown_client_events: event.unknown_client,
        unknown_client_rate: event.unknown_client ? 100 : 0,
        avg_risk_score: event.risk_score,
        max_risk_score: event.risk_score,
        highest_severity: event.severity,
        likely_attack_events: event.verdict === "LIKELY_ATTACK" ? 1 : 0,
        outside_hours_events: event.outside_business_hours,
        outside_hours_rate: event.outside_business_hours ? 100 : 0,
        modbus_disrupted_events: event.modbus_disrupted,
        modbus_disrupted_rate: event.modbus_disrupted ? 100 : 0,
        first_seen: event.event_time,
        last_seen: event.event_time,
        riskSamples: [event.risk_score],
        severityRank: severityRank[event.severity],
        first: eventTime,
        last: eventTime,
      });
      return;
    }

    existing.event_count += 1;
    existing.unknown_client_events += event.unknown_client;
    existing.likely_attack_events += event.verdict === "LIKELY_ATTACK" ? 1 : 0;
    existing.outside_hours_events += event.outside_business_hours;
    existing.modbus_disrupted_events += event.modbus_disrupted;
    existing.riskSamples.push(event.risk_score);
    existing.avg_risk_score = Number((existing.riskSamples.reduce((sum, item) => sum + item, 0) / existing.riskSamples.length).toFixed(1));
    existing.max_risk_score = Math.max(existing.max_risk_score, event.risk_score);
    existing.unknown_client_rate = Number(((existing.unknown_client_events / existing.event_count) * 100).toFixed(1));
    existing.outside_hours_rate = Number(((existing.outside_hours_events / existing.event_count) * 100).toFixed(1));
    existing.modbus_disrupted_rate = Number(((existing.modbus_disrupted_events / existing.event_count) * 100).toFixed(1));

    if (severityRank[event.severity] > existing.severityRank) {
      existing.highest_severity = event.severity;
      existing.severityRank = severityRank[event.severity];
    }
    if (eventTime < existing.first) {
      existing.first = eventTime;
      existing.first_seen = event.event_time;
    }
    if (eventTime > existing.last) {
      existing.last = eventTime;
      existing.last_seen = event.event_time;
    }
  });

  return Array.from(grouped.values())
    .sort((left, right) => right.max_risk_score - left.max_risk_score || right.event_count - left.event_count)
    .map(({ riskSamples: _riskSamples, severityRank: _severityRank, first: _first, last: _last, ...row }) => row);
}

function buildCommunicationFlow(params: Record<string, unknown>): OtCommunicationFlowApiRow[] {
  return aggregateTopFlows(filterEvents(params)).slice(0, 32).map((row) => ({
    source: row.source_ip,
    target: `${row.destination_ip}${row.port !== "-" ? `:${row.port}` : ""}`,
    weight: row.event_count,
    highest_severity: row.highest_severity,
    avg_risk_score: row.avg_risk_score,
    protocols: row.protocol,
    last_seen: row.last_seen,
  }));
}

function buildModbusUnitSummaries(params: Record<string, unknown>): OtCommunicationModbusUnitHealthApiRow[] {
  const { timeRange } = getTimeWindow(params);
  const multiplier = timeRange === "7d" ? 7 : timeRange === "3d" ? 3 : timeRange === "24h" ? 1.4 : 1;
  return [
    { unit_id: 0, total_requests: Math.round(960 * multiplier), success_count: Math.round(958 * multiplier), error_count: Math.round(2 * multiplier), slow_count: Math.round(4 * multiplier), response_time_avg_ms: 31, response_time_max_ms: 96 },
    { unit_id: 1, total_requests: Math.round(1440 * multiplier), success_count: Math.round(1432 * multiplier), error_count: Math.round(8 * multiplier), slow_count: Math.round(12 * multiplier), response_time_avg_ms: 42, response_time_max_ms: 168 },
    { unit_id: 11, total_requests: Math.round(1440 * multiplier), success_count: Math.round(1438 * multiplier), error_count: Math.round(2 * multiplier), slow_count: Math.round(6 * multiplier), response_time_avg_ms: 38, response_time_max_ms: 121 },
    { unit_id: 100, total_requests: Math.round(720 * multiplier), success_count: Math.round(699 * multiplier), error_count: Math.round(21 * multiplier), slow_count: Math.round(34 * multiplier), response_time_avg_ms: 86, response_time_max_ms: 352 },
  ];
}

function buildPowerKpis(params: Record<string, unknown>): PowerMonitoringKpisResponse {
  const latest = buildPowerTrend(params).points.at(-1);
  const activePower = Math.max(0, latest?.inverter_output ?? 0);
  const meterPower = latest?.meter_active_power ?? 0;
  const coverage = buildTelemetryCoverage(params).items;
  const reporting = coverage.find((item) => item.coverage_key === "reportingNormally")?.value ?? 0;
  const limited = coverage.find((item) => item.coverage_key === "limitedTelemetry")?.value ?? 0;
  const { timeRange, customStart, customEnd } = getTimeWindow(params);

  return {
    metrics: [
      {
        id: "solar-output",
        title: "Solar Inverter Output",
        value: `${activePower.toFixed(1)} kW`,
        delta: activePower > 20 ? "+4.8% vs baseline" : "Night/low irradiance",
        helper: "Unit 1 reported through OT Gateway telemetry.",
        trend: activePower > 20 ? "up" : "steady",
        tone: "emerald",
      },
      {
        id: "meter-active-power",
        title: "Factory Active Power",
        value: `${meterPower.toFixed(1)} kW`,
        delta: "Within expected load profile",
        helper: "Unit 11 power meter is visible as a logical downstream OT unit.",
        trend: "steady",
        tone: "sky",
      },
      {
        id: "ev-load",
        title: "EV Charger Visibility",
        value: "Online",
        delta: "10.40.20.42",
        helper: "Direct Ethernet/IP asset with expected cloud gateway communication.",
        trend: "steady",
        tone: "violet",
      },
      {
        id: "telemetry-coverage",
        title: "Telemetry Coverage",
        value: `${reporting}/${reporting + limited}`,
        delta: `${limited} limited visibility items`,
        helper: "Downstream devices are logical entities identified via OT Gateway telemetry.",
        trend: "steady",
        tone: limited > 0 ? "amber" : "emerald",
      },
    ],
    time_range: timeRange,
    custom_start: customStart,
    custom_end: customEnd,
    generated_at: nowIso(),
  };
}

function buildPowerTrend(params: Record<string, unknown>): PowerMonitoringPowerTrendResponse {
  const buckets = buildBuckets(params, 36);
  const points = buckets.map((bucket, index) => {
    const hour = bucket.getHours() + bucket.getMinutes() / 60;
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const solar = Number(Math.max(0, daylight * 68 + Math.sin(index / 2) * 3).toFixed(1));
    const evLoad = hour >= 9 && hour <= 17 ? 8 + (index % 4) * 1.3 : index % 9 === 0 ? 4.2 : 0;
    const factoryLoad = 34 + Math.sin(index / 3) * 4;
    return {
      bucket_start: bucket.toISOString(),
      smartlogger_aggregate: Number((solar + evLoad + 3.5).toFixed(1)),
      inverter_output: solar,
      meter_active_power: Number((factoryLoad + evLoad - solar * 0.35).toFixed(1)),
    };
  });
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { points, bucket_minutes: bucketMinutes(params, 36), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildEnvironmentalSignals(params: Record<string, unknown>): PowerMonitoringEnvironmentalSignalsResponse {
  const powerTrend = buildPowerTrend(params).points;
  const points = powerTrend.map((point, index) => {
    const hour = new Date(point.bucket_start).getHours();
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    return {
      bucket_start: point.bucket_start,
      irradiance_secondary: Number((daylight * 890 + (index % 5) * 12).toFixed(1)),
      module_temperature: Number((30 + daylight * 24 + Math.sin(index / 4) * 2).toFixed(1)),
      active_power: point.inverter_output,
      meter_voltage: Number((400 + Math.sin(index / 5) * 3.2).toFixed(1)),
    };
  });
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { points, bucket_minutes: bucketMinutes(params, 36), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildTelemetryProfile(params: Record<string, unknown>): PowerMonitoringTelemetryProfileResponse {
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return {
    items: [
      { device_type: "ot_gateway", device_count: 1, signal_count: 18, reporting_interval_seconds: 30 },
      { device_type: "solar_inverter", device_count: 1, signal_count: 14, reporting_interval_seconds: 30 },
      { device_type: "power_meter", device_count: 1, signal_count: 9, reporting_interval_seconds: 30 },
      { device_type: "emi", device_count: 1, signal_count: 6, reporting_interval_seconds: 60 },
      { device_type: "ev_charger", device_count: 1, signal_count: 8, reporting_interval_seconds: 60 },
      { device_type: "network_gateway", device_count: 2, signal_count: 5, reporting_interval_seconds: 60 },
    ],
    time_range: timeRange,
    custom_start: customStart,
    custom_end: customEnd,
    generated_at: nowIso(),
  };
}

function buildReportingCadence(params: Record<string, unknown>): PowerMonitoringReportingCadenceResponse {
  const points = buildBuckets(params, 24).map((bucket, index) => ({
    bucket_start: bucket.toISOString(),
    smartlogger3000: 12 - (index % 17 === 0 ? 1 : 0),
    inverter: 12 - (index % 19 === 0 ? 1 : 0),
    power_meter: 12,
    emi: 6 - (index % 11 === 0 ? 1 : 0),
  }));
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { points, bucket_minutes: bucketMinutes(params, 24), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildTelemetryCoverage(params: Record<string, unknown>): PowerMonitoringTelemetryCoverageResponse {
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return {
    items: [
      { coverage_key: "reportingNormally", value: 7 },
      { coverage_key: "limitedTelemetry", value: 2 },
      { coverage_key: "staleOrMissing", value: 0 },
    ],
    time_range: timeRange,
    custom_start: customStart,
    custom_end: customEnd,
    generated_at: nowIso(),
  };
}

function buildLatestStatus(params: Record<string, unknown>): PowerMonitoringLatestStatusResponse {
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  const rows: PowerMonitoringLatestStatusApiRow[] = [
    {
      device_name: "OT Gateway / Smart Logger / Unit 0",
      device_type: "ot_gateway",
      unit_id: 0,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(1),
      freshness_minutes: 1,
      health: "Healthy",
      summary: "Direct Ethernet/IP visibility; gateway telemetry source for downstream logical OT units.",
      active_power: null,
      daily_energy: null,
      meter_voltage: null,
      meter_active_power: null,
      irradiance_secondary: null,
      module_temperature: null,
    },
    {
      device_name: "Unit 1 = Solar Inverter",
      device_type: "solar_inverter",
      unit_id: 1,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(2),
      freshness_minutes: 2,
      health: "Healthy",
      summary: "Logical downstream unit identified via OT Gateway polling, not direct Ethernet discovery.",
      active_power: 48.6,
      daily_energy: 326.4,
      meter_voltage: null,
      meter_active_power: null,
      irradiance_secondary: 732,
      module_temperature: 49.2,
    },
    {
      device_name: "Unit 11 = Power Meter",
      device_type: "power_meter",
      unit_id: 11,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(1),
      freshness_minutes: 1,
      health: "Healthy",
      summary: "Logical downstream unit with stable meter telemetry through OT Gateway.",
      active_power: null,
      daily_energy: null,
      meter_voltage: 400.8,
      meter_active_power: 37.4,
      irradiance_secondary: null,
      module_temperature: null,
    },
    {
      device_name: "Unit 100 = Environmental Sensor",
      device_type: "emi",
      unit_id: 100,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(8),
      freshness_minutes: 8,
      health: "Watch",
      summary: "Logical downstream unit with occasional slow polling; partial visibility noted.",
      active_power: null,
      daily_energy: null,
      meter_voltage: null,
      meter_active_power: null,
      irradiance_secondary: 728,
      module_temperature: 48.9,
    },
    {
      device_name: "Industrial Cloud Gateway",
      device_type: "cloud_gateway",
      unit_id: 200,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(1),
      freshness_minutes: 1,
      health: "Healthy",
      summary: "Direct Ethernet/IP asset handling approved cloud telemetry forwarding.",
      active_power: null,
      daily_energy: null,
      meter_voltage: null,
      meter_active_power: null,
      irradiance_secondary: null,
      module_temperature: null,
    },
    {
      device_name: "EV Charger",
      device_type: "ev_charger",
      unit_id: 300,
      site: DEMO_SITE_NAME,
      last_seen: isoMinutesAgo(3),
      freshness_minutes: 3,
      health: "Healthy",
      summary: "Direct Ethernet/IP EV charging asset with expected cloud-gateway sessions.",
      active_power: 7.2,
      daily_energy: 42.7,
      meter_voltage: 399.4,
      meter_active_power: 7.2,
      irradiance_secondary: null,
      module_temperature: null,
    },
  ];

  return { rows, time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildCommunicationKpis(params: Record<string, unknown>): OtCommunicationControlKpisResponse {
  const events = filterEvents(params);
  const flows = aggregateTopFlows(events);
  const ips = new Set<string>();
  events.forEach((event) => {
    ips.add(event.source_ip);
    ips.add(event.destination_ip);
  });
  const modbus = buildModbusUnitSummaries(params);
  const totalRequests = modbus.reduce((sum, row) => sum + row.total_requests, 0);
  const totalErrors = modbus.reduce((sum, row) => sum + row.error_count, 0);
  const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
  const unknownEvents = events.filter((event) => event.unknown_client === 1).length;
  const { timeRange, customStart, customEnd } = getTimeWindow(params);

  return {
    metrics: [
      {
        id: "active-assets",
        title: "Observed IP Assets",
        value: String(ips.size),
        helper: "Router, switch, gateways, EV Charger, workstation, and observed peers.",
        trend_label: "Direct Ethernet/IP visibility",
        tone: "sky",
      },
      {
        id: "observed-flows",
        title: "Who Talks To Whom",
        value: String(flows.length),
        helper: `${events.length.toLocaleString()} communication events in the selected window.`,
        trend_label: "Flow mapping",
        tone: "violet",
      },
      {
        id: "unknown-client-events",
        title: "Unknown Client Events",
        value: String(unknownEvents),
        helper: `${DEMO_ASSET_IPS.unknownClient} remains unmapped for investigation examples.`,
        trend_label: "Identity coverage",
        tone: unknownEvents > 0 ? "amber" : "emerald",
      },
      {
        id: "modbus-success-rate",
        title: "Gateway Polling Health",
        value: `${successRate.toFixed(1)}%`,
        helper: "Downstream Unit 1, Unit 11, and Unit 100 visible via OT Gateway telemetry.",
        trend_label: "Indirect OT unit visibility",
        tone: successRate < 98 ? "amber" : "emerald",
      },
    ],
    time_range: timeRange,
    custom_start: customStart,
    custom_end: customEnd,
    generated_at: nowIso(),
  };
}

function buildSecurityKpis(params: Record<string, unknown>): OtSecurityExposureKpisResponse {
  const events = filterEvents(params);
  const high = events.filter((event) => event.severity === "high" || event.severity === "critical").length;
  const unknown = events.filter((event) => event.unknown_client === 1).length;
  const likelyAttack = events.filter((event) => event.verdict === "LIKELY_ATTACK").length;
  const outside = events.filter((event) => event.outside_business_hours === 1).length;
  const { timeRange, customStart, customEnd } = getTimeWindow(params);

  return {
    metrics: [
      {
        id: "total-events",
        title: "Security Events",
        value: String(events.length),
        helper: "Detections are generated from local demo telemetry.",
        trend_label: "Selected window",
        tone: "sky",
      },
      {
        id: "high-severity-events",
        title: "High/Critical Events",
        value: String(high),
        helper: "Concentrated around unknown client and remote maintenance scenarios.",
        trend_label: "Prioritized review",
        tone: high > 0 ? "red" : "emerald",
      },
      {
        id: "unknown-client-events",
        title: "Unknown Client Events",
        value: String(unknown),
        helper: "Unmapped client behavior supports known vs unknown device workflow.",
        trend_label: "Identity risk",
        tone: unknown > 0 ? "amber" : "emerald",
      },
      {
        id: "likely-attack-events",
        title: "Likely Attack Verdicts",
        value: String(likelyAttack),
        helper: `${outside} events occurred outside business hours.`,
        trend_label: "Behavioral signal",
        tone: likelyAttack > 0 ? "red" : "emerald",
      },
    ],
    time_range: timeRange,
    custom_start: customStart,
    custom_end: customEnd,
    generated_at: nowIso(),
  };
}

function bucketSecurityEvents(params: Record<string, unknown>) {
  const events = filterEvents(params);
  const buckets = buildBuckets(params, 24);
  return buckets.map((bucket, index) => {
    const next = buckets[index + 1] ?? new Date(bucket.getTime() + bucketMinutes(params, 24) * 60_000);
    const bucketEvents = events.filter((event) => {
      const time = new Date(event.event_time);
      return time >= bucket && time < next;
    });
    return { bucket, events: bucketEvents };
  });
}

function buildEventsOverTime(params: Record<string, unknown>): OtSecurityExposureEventsOverTimeResponse {
  const rows = bucketSecurityEvents(params).map(({ bucket, events }) => ({
    bucket_start: bucket.toISOString(),
    low: events.filter((event) => event.severity === "low").length,
    medium: events.filter((event) => event.severity === "medium").length,
    high: events.filter((event) => event.severity === "high").length,
    critical: events.filter((event) => event.severity === "critical").length,
  }));
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { rows, bucket_minutes: bucketMinutes(params, 24), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildVerdictDistribution(params: Record<string, unknown>): OtSecurityExposureVerdictDistributionResponse {
  const rows = bucketSecurityEvents(params).map(({ bucket, events }) => ({
    bucket_start: bucket.toISOString(),
    likely_legitimate: events.filter((event) => event.verdict === "LIKELY_LEGITIMATE").length,
    likely_legitimate_unknown_ip: events.filter((event) => event.verdict === "LIKELY_LEGITIMATE_UNKNOWN_IP").length,
    under_investigation: events.filter((event) => event.verdict === "UNDER_INVESTIGATION").length,
    likely_attack: events.filter((event) => event.verdict === "LIKELY_ATTACK").length,
  }));
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { rows, bucket_minutes: bucketMinutes(params, 24), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildTopRiskySources(params: Record<string, unknown>): OtSecurityExposureTopRiskySourcesResponse {
  const grouped = new Map<string, { source_ip: string; event_count: number; scores: number[]; max_risk_score: number }>();
  filterEvents(params).forEach((event) => {
    const existing = grouped.get(event.source_ip);
    if (!existing) {
      grouped.set(event.source_ip, {
        source_ip: event.source_ip,
        event_count: 1,
        scores: [event.risk_score],
        max_risk_score: event.risk_score,
      });
      return;
    }
    existing.event_count += 1;
    existing.scores.push(event.risk_score);
    existing.max_risk_score = Math.max(existing.max_risk_score, event.risk_score);
  });
  const rows = Array.from(grouped.values())
    .map((row) => ({
      source_ip: row.source_ip,
      event_count: row.event_count,
      avg_risk_score: Number((row.scores.reduce((sum, score) => sum + score, 0) / row.scores.length).toFixed(1)),
      max_risk_score: row.max_risk_score,
    }))
    .sort((left, right) => right.max_risk_score - left.max_risk_score || right.event_count - left.event_count)
    .slice(0, 8);
  const { timeRange, customStart, customEnd } = getTimeWindow(params);
  return { rows, time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() };
}

function buildFilters(): OtSecurityExposureFiltersResponse {
  return {
    protocols: [
      { name: "All Protocols", value: "all" },
      { name: "MODBUS", value: "modbus" },
      { name: "HTTPS", value: "https" },
      { name: "TLS", value: "tls" },
      { name: "UDP", value: "udp" },
    ],
    severity: [
      { name: "All Severity", value: "all" },
      { name: "Low", value: "low" },
      { name: "Medium", value: "medium" },
      { name: "High", value: "high" },
      { name: "Critical", value: "critical" },
    ],
    verdict: [
      { name: "All Verdict", value: "all" },
      { name: "Likely Legitimate", value: "LIKELY_LEGITIMATE" },
      { name: "Unknown IP", value: "LIKELY_LEGITIMATE_UNKNOWN_IP" },
      { name: "Under Investigation", value: "UNDER_INVESTIGATION" },
      { name: "Likely Attack", value: "LIKELY_ATTACK" },
    ],
    identity: [
      { name: "All Identity", value: "all" },
      { name: "Known Devices", value: "known" },
      { name: "Unknown Devices", value: "unknown" },
    ],
  };
}

function buildIncidents(state: DemoState, params: Record<string, unknown> = {}): DetectionIncidentApiRow[] {
  const allEvents = filterEvents({ ...params, timeRange: params.timeRange ?? "7d" });
  const group = (key: string, title: string, description: string, severity: DetectionIncidentApiRow["severity"], ruleIds: number[], predicate: (event: DemoSecurityEventSeed) => boolean): DetectionIncidentApiRow | null => {
    const related = allEvents.filter(predicate);
    if (!related.length) return null;
    const firstSeen = related.at(-1)?.event_time ?? related[0].event_time;
    const lastSeen = related[0].event_time;
    return {
      id: key,
      incident_key: key,
      status: state.incidentStatuses[key] ?? "open",
      severity,
      title,
      description,
      first_seen: firstSeen,
      last_seen: lastSeen,
      event_count: related.length,
      match_count: related.length,
      max_risk_score: Math.max(...related.map((event) => event.risk_score)),
      source_ips: Array.from(new Set(related.map((event) => event.source_ip))),
      destination_ips: Array.from(new Set(related.map((event) => event.destination_ip))),
      rule_ids: ruleIds,
      updated_at: lastSeen,
    };
  };

  return [
    group(
      "INC-ABC-UNKNOWN-MODBUS",
      "Unknown client attempted OT Gateway access",
      "Unmapped client behavior touched Modbus/TCP on the gateway. This supports the known versus unknown device investigation workflow.",
      "high",
      [1],
      (event) => event.source_ip === DEMO_ASSET_IPS.unknownClient,
    ),
    group(
      "INC-ABC-REMOTE-MAINT",
      "Remote maintenance activity outside window",
      "Remote endpoint traffic appeared outside the approved maintenance profile and remains acknowledged for review.",
      "critical",
      [2],
      (event) => event.source_ip === DEMO_ASSET_IPS.remoteMaintenance,
    ),
    group(
      "INC-ABC-MODBUS-DEGRADED",
      "Downstream logical unit polling degradation",
      "Gateway telemetry showed slow or failed polling for logical OT units behind the OT Gateway.",
      "medium",
      [3],
      (event) => event.modbus_disrupted === 1,
    ),
    group(
      "INC-ABC-CLOUD-DEVIATION",
      "Cloud egress baseline deviation",
      "Industrial Cloud Gateway egress exceeded its short-window baseline without evidence of direct downstream device exposure.",
      "medium",
      [4],
      (event) => event.classification === "cloud_egress_baseline_deviation",
    ),
  ].filter((item): item is DetectionIncidentApiRow => item !== null)
    .sort((left, right) => +new Date(right.last_seen) - +new Date(left.last_seen));
}

function incidentEventsForKey(incidentKey: string): DetectionIncidentEventApiRow[] {
  const state = getState();
  const incident = buildIncidents(state).find((item) => item.incident_key === incidentKey);
  if (!incident) return [];
  return generateSecurityEvents()
    .filter((event) => {
      if (incidentKey === "INC-ABC-UNKNOWN-MODBUS") return event.source_ip === DEMO_ASSET_IPS.unknownClient;
      if (incidentKey === "INC-ABC-REMOTE-MAINT") return event.source_ip === DEMO_ASSET_IPS.remoteMaintenance;
      if (incidentKey === "INC-ABC-MODBUS-DEGRADED") return event.modbus_disrupted === 1;
      if (incidentKey === "INC-ABC-CLOUD-DEVIATION") return event.classification === "cloud_egress_baseline_deviation";
      return false;
    })
    .map(({ ruleIds: _ruleIds, ...event }) => event);
}

function runtimeAction(message: string): PortRuntimeActionResponse {
  return {
    success: true,
    message,
    config_written: true,
    runtime_mapping_written: false,
    runtime_applied: true,
    runtime_method: "frontend-demo-simulation",
    applied_at: nowIso(),
  };
}

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

function createRuleFromPayload(payload: Partial<DetectionRuleApiRow>, id: number): DetectionRuleApiRow {
  const timestamp = nowIso();
  return {
    id,
    name: payload.name || "New Demo Rule",
    description: payload.description ?? null,
    rule_type: payload.rule_type ?? "single_event",
    logical_operator: payload.logical_operator ?? "AND",
    conditions: payload.conditions ?? [],
    action_severity: payload.action_severity ?? "MEDIUM",
    priority: payload.priority ?? 50,
    run_mode: payload.run_mode ?? "shadow",
    is_active: payload.is_active ?? true,
    allowlist_mode: payload.allowlist_mode ?? "apply",
    override_on_high_confidence: payload.override_on_high_confidence ?? false,
    time_window_seconds: payload.time_window_seconds ?? null,
    threshold_count: payload.threshold_count ?? null,
    aggregation_field: payload.aggregation_field ?? null,
    aggregation_function: payload.aggregation_function ?? null,
    group_by_fields: payload.group_by_fields ?? [],
    dedup_window_seconds: payload.dedup_window_seconds ?? null,
    tags: payload.tags ?? ["demo"],
    created_by_user_id: 1,
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

async function handleRequest<T>(
  method: MockHttpMethod,
  rawUrl: string,
  body?: unknown,
  config: MockRequestConfig = {},
): Promise<MockResponse<T>> {
  const path = normalizePath(rawUrl);
  const params = readUrlParams(rawUrl, config);
  const state = getState();

  if (path === "/auth/login" && method === "post") {
    const payload = body as { username?: string };
    const username = payload.username?.trim() || "demo.admin";
    const user = state.users.find((item) => item.username === username || item.email === username) ?? state.users[0];
    state.sessionUserId = user.id;
    user.last_login = nowIso();
    saveState(state);
    return withDelay(buildResponse({ message: "Demo login successful.", user: getCurrentUser(state) } as T, config));
  }

  if ((path === "/auth/check-session" || path === "/auth/me") && method === "get") {
    if (!state.sessionUserId) {
      throw new MockHttpError(401, "No active demo session.");
    }
    return withDelay(buildResponse({ message: "Demo session active.", user: getCurrentUser(state) } as T, config));
  }

  if (path === "/auth/logout" && method === "post") {
    state.sessionUserId = null;
    saveState(state);
    return withDelay(buildResponse({ success: true, message: "Demo session ended." } as T, config));
  }

  if (path === "/filters" && method === "get") {
    return withDelay(buildResponse(buildFilters() as T, config));
  }

  if (path === "/ports" && method === "get") {
    const search = toStringParam(params.search)?.toLowerCase();
    const status = toStringParam(params.status);
    let ports = [...state.ports];
    if (search) {
      ports = ports.filter((port) => [port.label, port.description, String(port.port_number)].some((item) => item?.toLowerCase().includes(search)));
    }
    if (status && status !== "all") {
      ports = ports.filter((port) => port.status === status);
    }
    const response: PortListResponse = {
      ports,
      total_count: ports.length,
      active_count: ports.filter((port) => port.status === "ACTIVE").length,
      inactive_count: ports.filter((port) => port.status === "INACTIVE").length,
    };
    return withDelay(buildResponse(response as T, config));
  }

  if (path === "/ports/request-new" && method === "post") {
    const created = mutateState((draft) => {
      const nextPort = Math.max(...draft.ports.map((port) => port.port_number)) + 1;
      const port = buildPort(nextId(draft.ports), nextPort, "Demo reserved input", "Frontend-only reserved input", false, false, 0);
      draft.ports.push(port);
      return port;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }

  if (path === "/ports/apply-config" && method === "post") {
    return withDelay(buildResponse(runtimeAction("Demo port configuration applied locally.") as T, config));
  }

  if (path === "/ports/hot-reload" && method === "post") {
    return withDelay(buildResponse(runtimeAction("Demo collector hot reload simulated in the browser.") as T, config));
  }

  const portMatch = path.match(/^\/ports\/(\d+)(?:\/(toggle|test))?$/);
  if (portMatch) {
    const portId = Number(portMatch[1]);
    const action = portMatch[2];
    const port = state.ports.find((item) => item.id === portId);
    if (!port) throw new MockHttpError(404, "Port not found.");

    if (action === "test" && method === "post") {
      return withDelay(buildResponse({
        port_number: port.port_number,
        success: true,
        test_timestamp: nowIso(),
        duration_ms: 24 + portId * 3,
        error_message: null,
      } as T, config));
    }

    if (action === "toggle" && method === "post") {
      const updated = mutateState((draft) => {
        const item = draft.ports.find((row) => row.id === portId);
        if (!item) throw new MockHttpError(404, "Port not found.");
        item.is_active = !item.is_active;
        item.status = item.is_active ? "ACTIVE" : "INACTIVE";
        item.updated_at = nowIso();
        return item;
      });
      return withDelay(buildResponse(updated as T, config));
    }

    if (method === "put") {
      const payload = body as Partial<PortFormValues>;
      const updated = mutateState((draft) => {
        const item = draft.ports.find((row) => row.id === portId);
        if (!item) throw new MockHttpError(404, "Port not found.");
        item.label = payload.label ?? item.label;
        item.description = payload.description ?? item.description;
        item.status = payload.status ?? item.status;
        item.is_active = item.status === "ACTIVE";
        item.updated_at = nowIso();
        return item;
      });
      return withDelay(buildResponse(updated as T, config));
    }

    if (method === "delete") {
      mutateState((draft) => {
        draft.ports = draft.ports.filter((item) => item.id !== portId);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path.startsWith("/power-monitoring/") || path.startsWith("/ot-telemetry/")) {
    const endpoint = path.split("/").pop();
    const response = endpoint === "kpis" ? buildPowerKpis(params)
      : endpoint === "power-trend" ? buildPowerTrend(params)
        : endpoint === "environmental-signals" ? buildEnvironmentalSignals(params)
          : endpoint === "telemetry-profile" ? buildTelemetryProfile(params)
            : endpoint === "reporting-cadence" ? buildReportingCadence(params)
              : endpoint === "telemetry-coverage" ? buildTelemetryCoverage(params)
                : endpoint === "latest-status" ? buildLatestStatus(params)
                  : null;
    if (response) return withDelay(buildResponse(response as T, config));
  }

  if (path === "/ot-communication/kpis" && method === "get") {
    return withDelay(buildResponse(buildCommunicationKpis(params) as T, config));
  }
  if (path === "/ot-communication/communication-flow" && method === "get") {
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ rows: buildCommunicationFlow(params), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }
  if (path === "/ot-communication/smartlogger-topology-flow" && method === "get") {
    const health = buildModbusUnitSummaries(params);
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    const rows: OtCommunicationSmartloggerTopologyApiRow[] = health.map((row) => {
      const unit = LOGICAL_OT_UNITS.find((item) => item.unitId === row.unit_id);
      return {
        gateway_host: "OT Gateway / Smart Logger / Unit 0",
        smartlogger_ip: DEMO_ASSET_IPS.otGateway,
        smartlogger_port: 502,
        unit_id: row.unit_id,
        device_type: unit?.type ?? "logical_unit",
        device_name: `${unit?.name ?? `Unit ${row.unit_id}`} (identified via OT Gateway)`,
        total_requests: row.total_requests,
        success_count: row.success_count,
        error_count: row.error_count,
        slow_count: row.slow_count,
        success_rate: row.total_requests > 0 ? Number(((row.success_count / row.total_requests) * 100).toFixed(1)) : 0,
        avg_response_time_ms: row.response_time_avg_ms,
        max_response_time_ms: row.response_time_max_ms,
        protocols: "modbus_tcp, gateway_telemetry",
        last_seen: isoMinutesAgo(row.unit_id === 100 ? 8 : 2),
      };
    });
    return withDelay(buildResponse({ rows, time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }
  if (path === "/ot-communication/top-communication-flows" && method === "get") {
    let rows = aggregateTopFlows(filterEvents(params));
    const source = toStringParam(params.source)?.toLowerCase();
    const destination = toStringParam(params.destination)?.toLowerCase();
    const protocol = toStringParam(params.protocol)?.toLowerCase();
    const severity = toStringParam(params.severity)?.toLowerCase();
    if (source) rows = rows.filter((row) => row.source_ip.toLowerCase().includes(source));
    if (destination) rows = rows.filter((row) => row.destination_ip.toLowerCase().includes(destination));
    if (protocol) rows = rows.filter((row) => row.protocol.toLowerCase() === protocol);
    if (severity) rows = rows.filter((row) => row.highest_severity.toLowerCase() === severity);
    const page = paginate(rows, params, 15);
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ ...page, time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }
  if (path === "/ot-communication/modbus-response-time-by-unit" && method === "get") {
    const points: OtCommunicationModbusResponseTimeApiPoint[] = buildBuckets(params, 24).flatMap((bucket, index) => [
      { bucket_start: bucket.toISOString(), unit_id: 0, avg_response_time_ms: 28 + (index % 4) },
      { bucket_start: bucket.toISOString(), unit_id: 1, avg_response_time_ms: 38 + (index % 6) },
      { bucket_start: bucket.toISOString(), unit_id: 11, avg_response_time_ms: 35 + (index % 5) },
      { bucket_start: bucket.toISOString(), unit_id: 100, avg_response_time_ms: 62 + (index % 7) * 8 },
    ]);
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ points, bucket_minutes: bucketMinutes(params, 24), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }
  if (path === "/ot-communication/modbus-requests-vs-errors" && method === "get") {
    const points: OtCommunicationModbusRequestsErrorsApiPoint[] = buildBuckets(params, 24).map((bucket, index) => ({
      bucket_start: bucket.toISOString(),
      total_requests: 160 + (index % 4) * 8,
      total_errors: index % 7 === 0 ? 3 : index % 5 === 0 ? 1 : 0,
    }));
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ points, bucket_minutes: bucketMinutes(params, 24), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }
  if (path === "/ot-communication/modbus-unit-health" && method === "get") {
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ rows: buildModbusUnitSummaries(params), time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }

  if (path === "/ot-security-exposure/kpis" && method === "get") {
    return withDelay(buildResponse(buildSecurityKpis(params) as T, config));
  }
  if (path === "/ot-security-exposure/events-over-time" && method === "get") {
    return withDelay(buildResponse(buildEventsOverTime(params) as T, config));
  }
  if (path === "/ot-security-exposure/verdict-distribution" && method === "get") {
    return withDelay(buildResponse(buildVerdictDistribution(params) as T, config));
  }
  if (path === "/ot-security-exposure/top-risky-sources" && method === "get") {
    return withDelay(buildResponse(buildTopRiskySources(params) as T, config));
  }
  if (path === "/ot-security-exposure/live-security-events" && method === "get") {
    const rows = filterEvents(params).map(({ ruleIds: _ruleIds, ...event }) => event);
    const page = paginate(rows, params, 50);
    const { timeRange, customStart, customEnd } = getTimeWindow(params);
    return withDelay(buildResponse({ ...page, time_range: timeRange, custom_start: customStart, custom_end: customEnd, generated_at: nowIso() } as T, config));
  }

  if (path === "/detection-engine/rules" && method === "get") {
    return withDelay(buildResponse(state.rules as T, config));
  }
  if (path === "/detection-engine/rules" && method === "post") {
    const created = mutateState((draft) => {
      const rule = createRuleFromPayload(body as Partial<DetectionRuleApiRow>, nextId(draft.rules));
      draft.rules.unshift(rule);
      return rule;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }
  if (path === "/detection-engine/rules/test" && method === "post") {
    const samples = filterEvents({ timeRange: "24h" }).slice(0, 5).map((event) => ({
      event_id: event.id,
      event_time: event.event_time,
      source_ip: event.source_ip,
      destination_ip: event.destination_ip,
      protocol: event.protocol,
      classification: event.classification,
      scenario_type: event.traffic_type,
      risk_score: event.risk_score,
    }));
    return withDelay(buildResponse({
      evaluated_events: 240,
      matched_events: samples.length,
      matched_ratio_percent: 2.1,
      samples,
      notes: ["Demo test evaluated local mock telemetry only.", "No remote worker or external service was called."],
    } as T, config));
  }
  const ruleMatch = path.match(/^\/detection-engine\/rules\/(\d+)$/);
  if (ruleMatch) {
    const ruleId = Number(ruleMatch[1]);
    if (method === "put") {
      const updated = mutateState((draft) => {
        const index = draft.rules.findIndex((item) => item.id === ruleId);
        if (index < 0) throw new MockHttpError(404, "Rule not found.");
        draft.rules[index] = { ...draft.rules[index], ...(body as Partial<DetectionRuleApiRow>), id: ruleId, updated_at: nowIso(), version: draft.rules[index].version + 1 };
        return draft.rules[index];
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.rules = draft.rules.filter((item) => item.id !== ruleId);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path === "/detection-engine/allowlists" && method === "get") return withDelay(buildResponse(state.allowlists as T, config));
  if (path === "/detection-engine/allowlists" && method === "post") {
    const created = mutateState((draft) => {
      const timestamp = nowIso();
      const payload = body as Partial<DetectionAllowlistApiRow>;
      const row: DetectionAllowlistApiRow = {
        id: nextId(draft.allowlists),
        name: payload.name || "New Demo Allowlist",
        description: payload.description ?? null,
        is_active: payload.is_active ?? true,
        source_ip: payload.source_ip ?? null,
        source_cidr: payload.source_cidr ?? null,
        destination_ip: payload.destination_ip ?? null,
        destination_cidr: payload.destination_cidr ?? null,
        direction: payload.direction ?? null,
        protocol: payload.protocol ?? null,
        destination_port_start: payload.destination_port_start ?? null,
        destination_port_end: payload.destination_port_end ?? null,
        classification: payload.classification ?? null,
        scenario_type: payload.scenario_type ?? null,
        enabled_start_at: payload.enabled_start_at ?? null,
        enabled_end_at: payload.enabled_end_at ?? null,
        max_matches_per_hour: payload.max_matches_per_hour ?? null,
        notes: payload.notes ?? null,
        created_by_user_id: 1,
        created_at: timestamp,
        updated_at: timestamp,
      };
      draft.allowlists.unshift(row);
      return row;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }
  const allowlistMatch = path.match(/^\/detection-engine\/allowlists\/(\d+)$/);
  if (allowlistMatch) {
    const id = Number(allowlistMatch[1]);
    if (method === "put") {
      const updated = mutateState((draft) => {
        const index = draft.allowlists.findIndex((item) => item.id === id);
        if (index < 0) throw new MockHttpError(404, "Allowlist not found.");
        draft.allowlists[index] = { ...draft.allowlists[index], ...(body as Partial<DetectionAllowlistApiRow>), id, updated_at: nowIso() };
        return draft.allowlists[index];
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.allowlists = draft.allowlists.filter((item) => item.id !== id);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path === "/detection-engine/device-mappings" && method === "get") return withDelay(buildResponse(state.deviceMappings as T, config));
  if (path === "/detection-engine/device-mappings" && method === "post") {
    const created = mutateState((draft) => {
      const payload = body as Partial<DetectionDeviceNameMappingApiRow>;
      const timestamp = nowIso();
      const row: DetectionDeviceNameMappingApiRow = {
        id: nextId(draft.deviceMappings),
        mapping_type: payload.mapping_type ?? "ip",
        ip_address: payload.ip_address ?? null,
        unit_id: payload.unit_id ?? null,
        display_name: payload.display_name || "New Demo Mapping",
        description: payload.description ?? null,
        is_active: payload.is_active ?? true,
        created_by_user_id: 1,
        created_at: timestamp,
        updated_at: timestamp,
      };
      draft.deviceMappings.unshift(row);
      return row;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }
  const mappingMatch = path.match(/^\/detection-engine\/device-mappings\/(\d+)$/);
  if (mappingMatch) {
    const id = Number(mappingMatch[1]);
    if (method === "put") {
      const updated = mutateState((draft) => {
        const index = draft.deviceMappings.findIndex((item) => item.id === id);
        if (index < 0) throw new MockHttpError(404, "Mapping not found.");
        draft.deviceMappings[index] = { ...draft.deviceMappings[index], ...(body as Partial<DetectionDeviceNameMappingApiRow>), id, updated_at: nowIso() };
        return draft.deviceMappings[index];
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.deviceMappings = draft.deviceMappings.filter((item) => item.id !== id);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path === "/detection-engine/notification-policies" && method === "get") return withDelay(buildResponse(state.notificationPolicies as T, config));
  if (path === "/detection-engine/notification-policies" && method === "post") {
    const created = mutateState((draft) => {
      const payload = body as Partial<DetectionNotificationPolicyApiRow>;
      const timestamp = nowIso();
      const row: DetectionNotificationPolicyApiRow = {
        id: nextId(draft.notificationPolicies),
        name: payload.name || "New Demo Policy",
        description: payload.description ?? null,
        is_active: payload.is_active ?? true,
        channel: payload.channel ?? "ui",
        min_severity: payload.min_severity ?? "MEDIUM",
        event_type: payload.event_type ?? "detection_match",
        target: payload.target ?? null,
        throttle_seconds: payload.throttle_seconds ?? 300,
        template: payload.template ?? { demo: true },
        created_by_user_id: 1,
        created_at: timestamp,
        updated_at: timestamp,
      };
      draft.notificationPolicies.unshift(row);
      return row;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }
  const policyMatch = path.match(/^\/detection-engine\/notification-policies\/(\d+)$/);
  if (policyMatch) {
    const id = Number(policyMatch[1]);
    if (method === "put") {
      const updated = mutateState((draft) => {
        const index = draft.notificationPolicies.findIndex((item) => item.id === id);
        if (index < 0) throw new MockHttpError(404, "Policy not found.");
        draft.notificationPolicies[index] = { ...draft.notificationPolicies[index], ...(body as Partial<DetectionNotificationPolicyApiRow>), id, updated_at: nowIso() };
        return draft.notificationPolicies[index];
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.notificationPolicies = draft.notificationPolicies.filter((item) => item.id !== id);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path === "/detection-engine/incidents" && method === "get") {
    let incidents = buildIncidents(state, params);
    const status = toStringParam(params.status);
    if (status) incidents = incidents.filter((incident) => incident.status === status);
    const page = paginate(incidents, params, 25);
    return withDelay(buildResponse({ ...page, generated_at: nowIso() } as T, config));
  }

  const incidentEventsMatch = path.match(/^\/detection-engine\/incidents\/([^/]+)\/events$/);
  if (incidentEventsMatch && method === "get") {
    const incidentKey = decodeURIComponent(incidentEventsMatch[1]);
    const incident = buildIncidents(state).find((item) => item.incident_key === incidentKey);
    if (!incident) throw new MockHttpError(404, "Incident not found.");
    const page = paginate(incidentEventsForKey(incidentKey), params, 25);
    return withDelay(buildResponse({ incident, ...page, generated_at: nowIso() } as T, config));
  }

  const incidentActionMatch = path.match(/^\/detection-engine\/incidents\/([^/]+)\/(ack|close|reopen)$/);
  if (incidentActionMatch && method === "post") {
    const incidentKey = decodeURIComponent(incidentActionMatch[1]);
    const action = incidentActionMatch[2];
    const incident = mutateState((draft) => {
      draft.incidentStatuses[incidentKey] = action === "ack" ? "ack" : action === "close" ? "closed" : "open";
      const updated = buildIncidents(draft).find((item) => item.incident_key === incidentKey);
      if (!updated) throw new MockHttpError(404, "Incident not found.");
      return updated;
    });
    return withDelay(buildResponse({ success: true, message: `Incident ${action} simulated locally.`, incident } as T, config));
  }

  if (path === "/detection-engine/workers/run-once" && method === "post") {
    return withDelay(buildResponse({
      detection: { events: 320, matches: 11, actionable_matches: 7 },
      incident: { matches: 7, mapped: 7, incidents_created: 0, incidents_updated: 4 },
    } as T, config));
  }

  if (path === "/notifications" && method === "get") {
    return withDelay(buildResponse(state.notifications as T, config));
  }
  const notificationMatch = path.match(/^\/notifications\/(\d+)(?:\/toggle-status)?$/);
  if (notificationMatch) {
    const id = Number(notificationMatch[1]);
    if (path.endsWith("/toggle-status") && method === "patch") {
      const updated = mutateState((draft) => {
        const item = draft.notifications.find((row) => row.id === id);
        if (!item) throw new MockHttpError(404, "Notification not found.");
        item.status = item.status === "READ" ? "SENT" : "READ";
        item.updated_at = nowIso();
        return item;
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.notifications = draft.notifications.filter((item) => item.id !== id);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  if (path === "/users-management" && method === "get") {
    const keyword = toStringParam(params.kw)?.toLowerCase();
    const status = toStringParam(params.status);
    const role = toStringParam(params.role);
    let rows = [...state.users];
    if (keyword) rows = rows.filter((user) => `${user.username} ${user.email}`.toLowerCase().includes(keyword));
    if (status) rows = rows.filter((user) => user.status === status);
    if (role) rows = rows.filter((user) => user.role === role);
    const page = paginate(rows, params, 20);
    return withDelay(buildResponse(page as T, config));
  }
  if (path === "/users-management" && method === "post") {
    const created = mutateState((draft) => {
      const payload = body as Partial<UserManagementCreatePayload>;
      const timestamp = nowIso();
      const row: UserManagementApiUserRow = {
        id: nextId(draft.users),
        username: payload.username || "demo.user",
        email: payload.email || "demo.user@abc-industrial.example",
        role: payload.role ?? "viewer",
        status: payload.status ?? "pending_verification",
        notification_enabled: payload.notification_enabled ?? true,
        last_login: null,
        created_at: timestamp,
        updated_at: timestamp,
      };
      draft.users.unshift(row);
      return row;
    });
    return withDelay(buildResponse(created as T, config, 201));
  }
  const userMatch = path.match(/^\/users-management\/(\d+)(?:\/toggle-status)?$/);
  if (userMatch) {
    const id = Number(userMatch[1]);
    if (path.endsWith("/toggle-status") && method === "post") {
      const updated = mutateState((draft) => {
        const item = draft.users.find((row) => row.id === id);
        if (!item) throw new MockHttpError(404, "User not found.");
        item.status = item.status === "active" ? "inactive" : "active";
        item.updated_at = nowIso();
        return item;
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "put") {
      const updated = mutateState((draft) => {
        const item = draft.users.find((row) => row.id === id);
        if (!item) throw new MockHttpError(404, "User not found.");
        const payload = body as Partial<UserManagementUpdatePayload>;
        item.username = payload.username ?? item.username;
        item.email = payload.email ?? item.email;
        item.role = payload.role ?? item.role;
        item.status = payload.status ?? item.status;
        item.notification_enabled = payload.notification_enabled ?? item.notification_enabled;
        item.updated_at = nowIso();
        return item;
      });
      return withDelay(buildResponse(updated as T, config));
    }
    if (method === "delete") {
      mutateState((draft) => {
        draft.users = draft.users.filter((item) => item.id !== id);
      });
      return withDelay(buildResponse(null as T, config));
    }
  }

  throw new MockHttpError(404, `Mock endpoint not implemented: ${method.toUpperCase()} ${path}`);
}

export function createMockApiClient() {
  return {
    interceptors: {
      response: {
        use: () => 0,
      },
    },
    get: <T = unknown>(url: string, config?: MockRequestConfig) => handleRequest<T>("get", url, undefined, config),
    post: <T = unknown>(url: string, data?: unknown, config?: MockRequestConfig) => handleRequest<T>("post", url, data, config),
    put: <T = unknown>(url: string, data?: unknown, config?: MockRequestConfig) => handleRequest<T>("put", url, data, config),
    patch: <T = unknown>(url: string, data?: unknown, config?: MockRequestConfig) => handleRequest<T>("patch", url, data, config),
    delete: <T = unknown>(url: string, config?: MockRequestConfig) => handleRequest<T>("delete", url, undefined, config),
  };
}

export const demoMetadata = {
  customerName: DEMO_CUSTOMER_NAME,
  siteName: DEMO_SITE_NAME,
  environmentName: DEMO_ENVIRONMENT_NAME,
  industry: "industrial energy / factory / solar + EV charging OT environment",
  directlyVisibleAssets: NETWORK_ASSETS.map((asset) => ({ name: asset.name, ip: asset.ip, type: asset.type })),
  logicalUnits: LOGICAL_OT_UNITS,
};

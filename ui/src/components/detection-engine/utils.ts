import type {
  DetectionAllowlistMutationPayload,
  DetectionDeviceNameMappingMutationPayload,
  DetectionNotificationPolicyMutationPayload,
  DetectionRuleMutationPayload,
} from "@/api/queries/detection-engine-queries";


export const DIRECTION_OPTIONS = [
  "inbound_to_smartlogger",
  "outbound_from_smartlogger",
  "inbound_to_ev_charger",
  "outbound_from_ev_charger",
  "inbound_to_cbox",
  "outbound_from_cbox",
  "internal_smartlogger_to_ev_charger",
  "arp",
  "summary",
] as const;

export const CLASSIFICATION_OPTIONS = [
  "modbus_write_request",
  "modbus_malformed_or_unknown",
  "modbus_error_response",
  "managed_internal_tcp_connection",
  "allowlisted_inbound_port_access",
  "unexpected_inbound_port_access",
  "https_access_attempt_to_smartlogger",
  "https_session_attempt_to_smartlogger",
  "https_access_attempt_to_managed_endpoint",
  "https_session_attempt_to_managed_endpoint",
  "smartlogger_outbound_external_connection",
  "managed_endpoint_outbound_external_connection",
  "icmp_probe_to_smartlogger",
  "icmp_probe_to_managed_endpoint",
  "allowlisted_icmp_probe",
  "icmp_response_from_smartlogger",
  "icmp_response_from_managed_endpoint",
  "modbus_polling_baseline_summary",
  "smartlogger_udp_baseline_summary",
  "managed_endpoint_udp_baseline_summary",
  "modbus_read_request",
  "modbus_response",
  "arp_activity",
] as const;

export const SCENARIO_TYPE_OPTIONS = [
  "network_observation",
  "https_behavioral_session",
  "modbus_write_operation",
  "modbus_protocol_anomaly",
  "modbus_error_pattern",
  "managed_internal_connection",
  "inbound_port_probe",
  "https_access_attempt",
  "managed_endpoint_external_connection",
  "icmp_probe",
  "icmp_response_activity",
  "modbus_polling_health",
  "udp_baseline",
  "modbus_read_activity",
  "modbus_response_activity",
  "arp_activity",
] as const;

export const DEVICE_MAPPING_TYPE_OPTIONS = [
  { value: "ip", label: "IP Address" },
  { value: "modbus_unit", label: "Modbus Unit ID" },
] as const;

export const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: "email", label: "Email Summary" },
  { value: "ui", label: "UI Notification" },
] as const;

export const NOTIFICATION_SEVERITY_OPTIONS = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
] as const;

export const SELECT_ANY_VALUE = "__any__";

export const ALLOWLIST_SELECT_TRIGGER_CLASS =
  "no-focus background-light800_dark300 text-dark500_light700 relative z-10 w-full min-h-12 cursor-pointer border px-5 py-1.5";
export const ALLOWLIST_SELECT_CONTENT_CLASS =
  "z-50 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg";

export function parseConditionValue(raw: string): string | number | boolean | string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.toLowerCase() === "true") {
    return true;
  }
  if (trimmed.toLowerCase() === "false") {
    return false;
  }

  const numberValue = Number(trimmed);
  if (!Number.isNaN(numberValue) && Number.isFinite(numberValue)) {
    return numberValue;
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return trimmed;
    }
  }

  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return trimmed;
}

export function parseOptionalNumber(raw: string): number | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isNumberInputValid(
  value: string,
  {
    allowEmpty = true,
    min,
    max,
    integerOnly = false,
  }: {
    allowEmpty?: boolean;
    min?: number;
    max?: number;
    integerOnly?: boolean;
  } = {},
): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return allowEmpty;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return false;
  }
  if (integerOnly && !Number.isInteger(parsed)) {
    return false;
  }
  if (min !== undefined && parsed < min) {
    return false;
  }
  if (max !== undefined && parsed > max) {
    return false;
  }

  return true;
}

export function severityBadgeClass(severity: string) {
  const normalized = severity.toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }
  if (normalized === "medium") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

export function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "closed") {
    return "border-slate-500/40 bg-slate-500/10 text-slate-200";
  }
  if (normalized === "ack") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-300";
  }
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

export function formatOptionLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1) : chunk))
    .join(" ");
}

const DETECTION_FORM_SCROLL_RETRY_DELAY_MS = 180;

function scrollMainContainerToTop(behavior: ScrollBehavior): boolean {
  const scrollContainer = document.getElementById("app-main-scroll-container");
  if (!scrollContainer) {
    return false;
  }

  scrollContainer.scrollTo({
    top: 0,
    behavior,
  });
  return true;
}

export function scrollDetectionFormIntoView(formId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const attemptScroll = (behavior: ScrollBehavior) => {
    if (scrollMainContainerToTop(behavior)) {
      return;
    }

    const target = document.getElementById(formId);
    if (target) {
      target.scrollIntoView({ behavior, block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  };

  window.requestAnimationFrame(() => {
    attemptScroll("smooth");

    // Dropdown focus restoration can override the first scroll; run one final pass.
    window.setTimeout(() => {
      attemptScroll("auto");
    }, DETECTION_FORM_SCROLL_RETRY_DELAY_MS);
  });
}

export function getAllowlistDefaultValues(): DetectionAllowlistFormValues {
  return {
    id: null,
    name: "",
    protocol: "",
    source_ip: "",
    source_cidr: "",
    destination_ip: "",
    destination_cidr: "",
    direction: "",
    classification: "",
    scenario_type: "",
    destination_port_start: "",
    destination_port_end: "",
    max_matches_per_hour: "",
    is_active: true,
    description: "",
    notes: "",
  };
}

export function getDeviceMappingDefaultValues(): DetectionDeviceMappingFormValues {
  return {
    id: null,
    mapping_type: "ip",
    ip_address: "",
    unit_id: "",
    display_name: "",
    description: "",
    is_active: true,
  };
}

export function getNotificationPolicyDefaultValues(): DetectionNotificationPolicyFormValues {
  return {
    id: null,
    name: "",
    description: "",
    is_active: true,
    channel: "email",
    min_severity: "HIGH",
    event_type: "incident.created",
    throttle_seconds: "300",
  };
}

export function getRuleDefaultValues(): DetectionRuleFormValues {
  return {
    id: null,
    name: "",
    description: "",
    rule_type: "single_event",
    logical_operator: "AND",
    action_severity: "MEDIUM",
    priority: "100",
    run_mode: "active",
    is_active: true,
    allowlist_mode: "reduce",
    override_on_high_confidence: true,
    time_window_seconds: "",
    threshold_count: "",
    aggregation_field: "",
    aggregation_function: "count",
    group_by_fields: "source_ip,destination_ip",
    dedup_window_seconds: "300",
    tags: "detection_engine",
    conditions: [
      {
        id: Date.now(),
        field: "classification",
        operator: "contains",
        value: "modbus",
      },
    ],
  };
}

export function mapRuleApiRowToFormValues(rule: DetectionRuleApiRow): DetectionRuleFormValues {
  return {
    id: rule.id,
    name: rule.name ?? "",
    description: rule.description ?? "",
    rule_type: rule.rule_type ?? "single_event",
    logical_operator: rule.logical_operator ?? "AND",
    action_severity: rule.action_severity ?? "MEDIUM",
    priority: String(rule.priority ?? 100),
    run_mode: rule.run_mode ?? "active",
    is_active: rule.is_active,
    allowlist_mode: rule.allowlist_mode || "reduce",
    override_on_high_confidence: rule.override_on_high_confidence,
    time_window_seconds: rule.time_window_seconds ? String(rule.time_window_seconds) : "",
    threshold_count: rule.threshold_count ? String(rule.threshold_count) : "",
    aggregation_field: rule.aggregation_field || "",
    aggregation_function: rule.aggregation_function || "count",
    group_by_fields: (rule.group_by_fields || []).join(","),
    dedup_window_seconds: rule.dedup_window_seconds ? String(rule.dedup_window_seconds) : "",
    tags: (rule.tags || []).join(","),
    conditions: (rule.conditions || []).length > 0
      ? rule.conditions.map((item, index) => ({
        id: Date.now() + index,
        field: item.field || "",
        operator: item.operator || "equals",
        value: Array.isArray(item.value)
          ? item.value.join(",")
          : item.value === null || item.value === undefined ? ""
          : String(item.value),
      }))
      : [{ id: Date.now(), field: "", operator: "equals", value: "" }],
  };
}

export function buildRuleMutationPayload(values: DetectionRuleFormValues): DetectionRuleMutationPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    rule_type: values.rule_type,
    logical_operator: values.logical_operator,
    conditions: values.conditions.map((item) => ({
      field: item.field.trim(),
      operator: item.operator.trim(),
      value: parseConditionValue(item.value),
    })),
    action_severity: values.action_severity,
    priority: Number(values.priority),
    run_mode: values.run_mode,
    is_active: values.is_active,
    allowlist_mode: values.allowlist_mode.trim() || "reduce",
    override_on_high_confidence: values.override_on_high_confidence,
    time_window_seconds: parseOptionalNumber(values.time_window_seconds),
    threshold_count: parseOptionalNumber(values.threshold_count),
    aggregation_field: values.aggregation_field.trim() || null,
    aggregation_function: values.aggregation_function.trim() || null,
    group_by_fields: values.group_by_fields.split(",").map((item) => item.trim()).filter(Boolean),
    dedup_window_seconds: parseOptionalNumber(values.dedup_window_seconds),
    tags: values.tags.split(",").map((item) => item.trim()).filter(Boolean),
  };
}

export function buildRuleTestRequest(
  values: DetectionRuleFormValues,
  lookbackHours: number,
  maxEvents: number,
): DetectionRuleTestRequest {
  return {
    lookback_hours: lookbackHours,
    max_events: maxEvents,
    rule: buildRuleMutationPayload(values),
  };
}

export function mapAllowlistApiRowToFormValues(item: DetectionAllowlistApiRow): DetectionAllowlistFormValues {
  return {
    id: item.id,
    name: item.name ?? "",
    protocol: item.protocol ?? "",
    source_ip: item.source_ip ?? "",
    source_cidr: item.source_cidr ?? "",
    destination_ip: item.destination_ip ?? "",
    destination_cidr: item.destination_cidr ?? "",
    direction: item.direction ?? "",
    classification: item.classification ?? "",
    scenario_type: item.scenario_type ?? "",
    destination_port_start: item.destination_port_start ? String(item.destination_port_start) : "",
    destination_port_end: item.destination_port_end ? String(item.destination_port_end) : "",
    max_matches_per_hour: item.max_matches_per_hour ? String(item.max_matches_per_hour) : "",
    is_active: item.is_active,
    description: item.description ?? "",
    notes: item.notes ?? "",
  };
}

export function mapDeviceMappingApiRowToFormValues(
  mapping: DetectionDeviceNameMappingApiRow,
): DetectionDeviceMappingFormValues {
  return {
    id: mapping.id,
    mapping_type: mapping.mapping_type,
    ip_address: mapping.ip_address ?? "",
    unit_id: mapping.unit_id !== null ? String(mapping.unit_id) : "",
    display_name: mapping.display_name ?? "",
    description: mapping.description ?? "",
    is_active: mapping.is_active,
  };
}

export function mapNotificationPolicyApiRowToFormValues(
  policy: DetectionNotificationPolicyApiRow,
): DetectionNotificationPolicyFormValues {
  return {
    id: policy.id,
    name: policy.name ?? "",
    description: policy.description ?? "",
    is_active: policy.is_active,
    channel: policy.channel === "ui" ? "ui" : "email",
    min_severity: policy.min_severity ?? "HIGH",
    event_type: policy.event_type ?? "incident.created",
    throttle_seconds: String(policy.throttle_seconds ?? 300),
  };
}

export function buildAllowlistMutationPayload(values: DetectionAllowlistFormValues): DetectionAllowlistMutationPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    is_active: values.is_active,
    source_ip: values.source_ip.trim(),
    source_cidr: values.source_cidr.trim(),
    destination_ip: values.destination_ip.trim(),
    destination_cidr: values.destination_cidr.trim(),
    direction: values.direction.trim(),
    protocol: values.protocol.trim(),
    destination_port_start: parseOptionalNumber(values.destination_port_start),
    destination_port_end: parseOptionalNumber(values.destination_port_end),
    classification: values.classification.trim(),
    scenario_type: values.scenario_type.trim(),
    enabled_start_at: null,
    enabled_end_at: null,
    max_matches_per_hour: parseOptionalNumber(values.max_matches_per_hour),
    notes: values.notes.trim() || null,
  };
}

export function buildDeviceMappingMutationPayload(
  values: DetectionDeviceMappingFormValues,
): DetectionDeviceNameMappingMutationPayload {
  return {
    mapping_type: values.mapping_type,
    ip_address: values.mapping_type === "ip" ? values.ip_address.trim() : null,
    unit_id: values.mapping_type === "modbus_unit" ? parseOptionalNumber(values.unit_id) : null,
    display_name: values.display_name.trim(),
    description: values.description.trim() || null,
    is_active: values.is_active,
  };
}

export function buildNotificationPolicyMutationPayload(
  values: DetectionNotificationPolicyFormValues,
): DetectionNotificationPolicyMutationPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    is_active: values.is_active,
    channel: values.channel,
    min_severity: values.min_severity,
    event_type: values.event_type.trim(),
    target: null,
    throttle_seconds: Number(values.throttle_seconds),
    template: {},
  };
}

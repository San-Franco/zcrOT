export type RuleConditionDraft = {
  id: number;
  field: string;
  operator: string;
  value: string;
};

export type RuleFormState = {
  id: number | null;
  name: string;
  description: string;
  rule_type: "single_event" | "threshold" | "aggregation" | "correlation";
  logical_operator: "AND" | "OR";
  action_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INFO";
  priority: string;
  run_mode: "active" | "shadow";
  is_active: boolean;
  allowlist_mode: string;
  override_on_high_confidence: boolean;
  time_window_seconds: string;
  threshold_count: string;
  aggregation_field: string;
  aggregation_function: string;
  group_by_fields: string;
  dedup_window_seconds: string;
  tags: string;
  conditions: RuleConditionDraft[];
};

export type AllowlistFormState = {
  id: number | null;
  name: string;
  description: string;
  is_active: boolean;
  source_ip: string;
  source_cidr: string;
  destination_ip: string;
  destination_cidr: string;
  direction: string;
  protocol: string;
  destination_port_start: string;
  destination_port_end: string;
  classification: string;
  scenario_type: string;
  max_matches_per_hour: string;
  notes: string;
};

export type NotificationPolicyFormState = {
  id: number | null;
  name: string;
  description: string;
  is_active: boolean;
  channel: "ui" | "email";
  min_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INFO";
  event_type: string;
  throttle_seconds: string;
};

export type DeviceMappingFormState = {
  id: number | null;
  mapping_type: "ip" | "modbus_unit";
  ip_address: string;
  unit_id: string;
  display_name: string;
  description: string;
  is_active: boolean;
};

export type DetectionSubTab = "allowlists" | "device-mappings" | "rules" | "notifications" | "incidents";

export function createDefaultRuleForm(): RuleFormState {
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

export function createDefaultAllowlistForm(): AllowlistFormState {
  return {
    id: null,
    name: "",
    description: "",
    is_active: true,
    source_ip: "",
    source_cidr: "",
    destination_ip: "",
    destination_cidr: "",
    direction: "",
    protocol: "",
    destination_port_start: "",
    destination_port_end: "",
    classification: "",
    scenario_type: "",
    max_matches_per_hour: "",
    notes: "",
  };
}

export function createDefaultNotificationPolicyForm(): NotificationPolicyFormState {
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

export function createDefaultDeviceMappingForm(): DeviceMappingFormState {
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

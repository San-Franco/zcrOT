export {};

declare global {
  type DetectionRuleConditionInput = {
    field: string;
    operator: string;
    value: string | number | boolean | string[] | null;
  };

  type DetectionRuleApiRow = {
    id: number;
    name: string;
    description: string | null;
    rule_type: "single_event" | "threshold" | "aggregation" | "correlation";
    logical_operator: "AND" | "OR";
    conditions: DetectionRuleConditionInput[];
    action_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INFO";
    priority: number;
    run_mode: "active" | "shadow";
    is_active: boolean;
    allowlist_mode: string;
    override_on_high_confidence: boolean;
    time_window_seconds: number | null;
    threshold_count: number | null;
    aggregation_field: string | null;
    aggregation_function: string | null;
    group_by_fields: string[];
    dedup_window_seconds: number | null;
    tags: string[];
    created_by_user_id: number | null;
    version: number;
    created_at: string;
    updated_at: string;
  };

  type DetectionAllowlistApiRow = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    source_ip: string | null;
    source_cidr: string | null;
    destination_ip: string | null;
    destination_cidr: string | null;
    direction: string | null;
    protocol: string | null;
    destination_port_start: number | null;
    destination_port_end: number | null;
    classification: string | null;
    scenario_type: string | null;
    enabled_start_at: string | null;
    enabled_end_at: string | null;
    max_matches_per_hour: number | null;
    notes: string | null;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
  };

  type DetectionAllowlistFormValues = {
    id: number | null;
    name: string;
    protocol: string;
    source_ip: string;
    source_cidr: string;
    destination_ip: string;
    destination_cidr: string;
    direction: string;
    classification: string;
    scenario_type: string;
    destination_port_start: string;
    destination_port_end: string;
    max_matches_per_hour: string;
    is_active: boolean;
    description: string;
    notes: string;
  };

  type DetectionRuleConditionFormValue = {
    id: number;
    field: string;
    operator: string;
    value: string;
  };

  type DetectionDeviceMappingFormValues = {
    id: number | null;
    mapping_type: "ip" | "modbus_unit";
    ip_address: string;
    unit_id: string;
    display_name: string;
    description: string;
    is_active: boolean;
  };

  type DetectionNotificationPolicyFormValues = {
    id: number | null;
    name: string;
    description: string;
    is_active: boolean;
    channel: "ui" | "email";
    min_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INFO";
    event_type: string;
    throttle_seconds: string;
  };

  type DetectionRuleFormValues = {
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
    conditions: DetectionRuleConditionFormValue[];
  };

  type DetectionRuleTestRequest = {
    lookback_hours: number;
    max_events: number;
    rule: Omit<DetectionRuleApiRow, "id" | "created_by_user_id" | "version" | "created_at" | "updated_at">;
  };

  type DetectionNotificationPolicyApiRow = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    channel: "ui" | "email" | "webhook" | "slack";
    min_severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INFO";
    event_type: string;
    target: string | null;
    throttle_seconds: number;
    template: Record<string, unknown>;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
  };

  type DetectionDeviceNameMappingApiRow = {
    id: number;
    mapping_type: "ip" | "modbus_unit";
    ip_address: string | null;
    unit_id: number | null;
    display_name: string;
    description: string | null;
    is_active: boolean;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
  };

  type DetectionRuleTestSample = {
    event_id: string;
    event_time: string;
    source_ip: string;
    destination_ip: string;
    protocol: string;
    classification: string;
    scenario_type: string;
    risk_score: number;
  };

  type DetectionRuleTestResponse = {
    evaluated_events: number;
    matched_events: number;
    matched_ratio_percent: number;
    samples: DetectionRuleTestSample[];
    notes: string[];
  };

  type DetectionIncidentApiRow = {
    id: string;
    incident_key: string;
    status: "open" | "ack" | "closed";
    severity: "info" | "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    first_seen: string;
    last_seen: string;
    event_count: number;
    match_count: number;
    max_risk_score: number;
    source_ips: string[];
    destination_ips: string[];
    rule_ids: number[];
    updated_at: string;
  };

  type DetectionIncidentsResponse = {
    rows: DetectionIncidentApiRow[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
    generated_at: string;
  };

  type DetectionIncidentEventApiRow = {
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
    severity: string;
    verdict: string;
    risk_score: number;
    unknown_client: number;
    outside_business_hours: number;
    modbus_disrupted: number;
    message: string;
    raw_message: string;
  };

  type DetectionIncidentEventsResponse = {
    incident: DetectionIncidentApiRow;
    rows: DetectionIncidentEventApiRow[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
    generated_at: string;
  };

  type DetectionIncidentStatusActionResponse = {
    success: boolean;
    message: string;
    incident: DetectionIncidentApiRow;
  };

  type DetectionWorkerRunOnceResponse = {
    detection: {
      events: number;
      matches: number;
      actionable_matches: number;
    };
    incident: {
      matches: number;
      mapped: number;
      incidents_created: number;
      incidents_updated: number;
    };
  };
}

export const RULE_TYPE_OPTIONS = ["single_event", "threshold", "aggregation", "correlation"] as const;
export const RULE_SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "INFO"] as const;

export const CONDITION_OPERATOR_OPTIONS = [
  "equals",
  "not_equals",
  "contains",
  "starts_with",
  "ends_with",
  "in",
  "not_in",
  "gt",
  "gte",
  "lt",
  "lte",
] as const;

export const AGGREGATION_FUNCTION_OPTIONS = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "distinct", label: "Distinct" },
  { value: "distinct_count", label: "Distinct Count" },
  { value: "uniq", label: "Uniq" },
] as const;

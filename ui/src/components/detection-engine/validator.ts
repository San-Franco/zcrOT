import { z } from "zod";
import {
  AGGREGATION_FUNCTION_OPTIONS,
  RULE_SEVERITY_OPTIONS,
  RULE_TYPE_OPTIONS,
} from "./constants";

const requiredMessage = (fieldLabel: string) => `${fieldLabel} is required.`;

const normalizeNullableStringInput = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return value;
};

const requiredString = (fieldLabel: string) =>
  z.preprocess(
    normalizeNullableStringInput,
    z.string().trim().min(1, requiredMessage(fieldLabel)),
  );

const optionalString = () =>
  z.preprocess(
    normalizeNullableStringInput,
    z.string().transform((value) => value.trim()),
  );

const positiveIntegerSchema = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage(fieldLabel))
    .regex(/^\d+$/, `${fieldLabel} must be a valid integer.`)
    .refine((value) => Number(value) >= 1, `${fieldLabel} must be at least 1.`);

const optionalPortSchema = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      `${fieldLabel} must be a valid integer.`,
    )
    .refine((value) => {
      if (value === "" || !/^\d+$/.test(value)) {
        return true;
      }
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535;
    }, `${fieldLabel} must be between 1 and 65535.`);

const optionalPositiveIntegerSchema = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1),
      `${fieldLabel} must be a positive integer.`,
    );

const DEVICE_MAPPING_UNIT_ID_SCHEMA = (fieldLabel: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string") {
        return value;
      }
      if (value === null || value === undefined) {
        return "";
      }
      return String(value);
    },
    z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d+$/.test(value), `${fieldLabel} must be a valid integer.`)
      .refine((value) => value === "" || Number(value) <= 65535, `${fieldLabel} must be between 0 and 65535.`),
  );

const NOTIFICATION_THROTTLE_SCHEMA = positiveIntegerSchema("Throttle seconds")
  .refine((value) => Number(value) <= 86400, "Throttle seconds must be between 1 and 86400.");

const RULE_REQUIRED_STRING = (fieldLabel: string) =>
  z.string().trim().min(1, `${fieldLabel} is required.`);

const RULE_REQUIRED_POSITIVE_INTEGER = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldLabel} is required.`)
    .regex(/^\d+$/, `${fieldLabel} must be a valid integer.`)
    .refine((value) => Number(value) >= 1, `${fieldLabel} must be at least 1.`);

const RULE_OPTIONAL_POSITIVE_INTEGER = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1),
      `${fieldLabel} must be a positive integer.`,
    );

export const detectionAllowlistFormSchema = z
  .object({
    id: z.number().nullable(),
    name: requiredString("Name"),
    protocol: optionalString(),
    source_ip: requiredString("Source IP"),
    source_cidr: optionalString(),
    destination_ip: optionalString(),
    destination_cidr: optionalString(),
    direction: optionalString(),
    classification: optionalString(),
    scenario_type: optionalString(),
    destination_port_start: optionalPortSchema("Port start"),
    destination_port_end: optionalPortSchema("Port end"),
    max_matches_per_hour: optionalPositiveIntegerSchema("Max matches per hour"),
    is_active: z.boolean(),
    description: z.string().transform((value) => value.trim()),
    notes: z.string().transform((value) => value.trim()),
  })
  .refine(
    (values) => {
      if (!values.destination_port_start || !values.destination_port_end) {
        return true;
      }
      return Number(values.destination_port_end) >= Number(values.destination_port_start);
    },
    {
      message: "Port end must be greater than or equal to port start.",
      path: ["destination_port_end"],
    },
  );

const detectionRuleConditionFormSchema = z.object({
  id: z.number(),
  field: RULE_REQUIRED_STRING("Condition field"),
  operator: RULE_REQUIRED_STRING("Condition operator"),
  value: RULE_REQUIRED_STRING("Condition value"),
});

export const detectionRuleFormSchema = z.object({
  id: z.number().nullable(),
  name: RULE_REQUIRED_STRING("Rule name"),
  description: z.string().transform((value) => value.trim()),
  rule_type: z.enum(RULE_TYPE_OPTIONS, { message: "Rule type is required." }),
  logical_operator: z.enum(["AND", "OR"], { message: "Logical operator is required." }),
  action_severity: z.enum(RULE_SEVERITY_OPTIONS, { message: "Severity is required." }),
  priority: RULE_REQUIRED_POSITIVE_INTEGER("Priority"),
  run_mode: z.enum(["active", "shadow"], { message: "Run mode is required." }),
  is_active: z.boolean(),
  allowlist_mode: RULE_REQUIRED_STRING("Allowlist mode"),
  override_on_high_confidence: z.boolean(),
  time_window_seconds: RULE_OPTIONAL_POSITIVE_INTEGER("Time window"),
  threshold_count: RULE_OPTIONAL_POSITIVE_INTEGER("Threshold count"),
  aggregation_field: z.string().transform((value) => value.trim()),
  aggregation_function: z.enum(AGGREGATION_FUNCTION_OPTIONS.map((item) => item.value) as [string, ...string[]], { message: "Aggregation function is required." }),
  group_by_fields: z.string().transform((value) => value.trim()),
  dedup_window_seconds: RULE_OPTIONAL_POSITIVE_INTEGER("Dedup window"),
  tags: z.string().transform((value) => value.trim()),
  conditions: z.array(detectionRuleConditionFormSchema).min(1, "At least one condition is required."),
});

export const detectionDeviceMappingFormSchema = z
  .object({
    id: z.number().nullable(),
    mapping_type: z.enum(["ip", "modbus_unit"]),
    ip_address: z.preprocess(
      (value) => {
        if (typeof value === "string") {
          return value;
        }
        if (value === null || value === undefined) {
          return "";
        }
        return String(value);
      },
      z.string().trim(),
    ),
    unit_id: DEVICE_MAPPING_UNIT_ID_SCHEMA("Unit ID"),
    display_name: requiredString("Display name"),
    description: z.preprocess(
      (value) => {
        if (typeof value === "string") {
          return value;
        }
        if (value === null || value === undefined) {
          return "";
        }
        return String(value);
      },
      z.string().trim(),
    ),
    is_active: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.mapping_type === "ip" && !values.ip_address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage("IP address"),
        path: ["ip_address"],
      });
    }

    if (values.mapping_type === "modbus_unit" && !values.unit_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredMessage("Unit ID"),
        path: ["unit_id"],
      });
    }
  });

export const detectionNotificationPolicyFormSchema = z.object({
  id: z.number().nullable(),
  name: requiredString("Policy name"),
  description: z.string().trim(),
  is_active: z.boolean(),
  channel: z.enum(["ui", "email"], { message: "Channel is required." }),
  min_severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "INFO"], { message: "Min severity is required." }),
  event_type: requiredString("Event type"),
  throttle_seconds: NOTIFICATION_THROTTLE_SCHEMA,
});

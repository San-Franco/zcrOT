import type { DetectionRuleMutationPayload } from "@/api/queries/detection-engine-queries";
import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import ConfirmModal from "@/components/modals/confirm-modal";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import Spinner from "@/components/shared/spinner";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDateTimeInBangkok, getApiErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { FiActivity, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import {
  AGGREGATION_FUNCTION_OPTIONS,
  CONDITION_OPERATOR_OPTIONS,
  RULE_SEVERITY_OPTIONS,
  RULE_TYPE_OPTIONS,
} from "./constants";
import {
  ALLOWLIST_SELECT_CONTENT_CLASS,
  ALLOWLIST_SELECT_TRIGGER_CLASS,
  buildRuleMutationPayload,
  buildRuleTestRequest,
  formatOptionLabel,
  getRuleDefaultValues,
  mapRuleApiRowToFormValues,
  scrollDetectionFormIntoView,
} from "./utils";
import { detectionRuleFormSchema } from "./validator";

type RulesQueryState = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
};

type MutationState = { isPending: boolean };
type CreateRuleMutationState = MutationState & { mutateAsync: (payload: DetectionRuleMutationPayload) => Promise<unknown> };
type UpdateRuleMutationState = MutationState & { mutateAsync: (input: { ruleId: number; payload: DetectionRuleMutationPayload }) => Promise<unknown> };
type DeleteRuleMutationState = MutationState & { mutate: (ruleId: number) => void };
type TestRuleMutationState = MutationState & {
  data: DetectionRuleTestResponse | undefined;
  mutateAsync: (payload: DetectionRuleTestRequest) => Promise<unknown>;
};

interface DetectionRulesTabProps {
  rules: DetectionRuleApiRow[];
  rulesQuery: RulesQueryState;
  createRuleMutation: CreateRuleMutationState;
  updateRuleMutation: UpdateRuleMutationState;
  deleteRuleMutation: DeleteRuleMutationState;
  testRuleMutation: TestRuleMutationState;
  isBusy: boolean;
  isRefreshing?: boolean;
  isViewer?: boolean;
  onViewerActionDenied?: () => void;
}

const REQUIRED_STAR = <span className="text-red-600"> *</span>;
const INPUT_CLASS = "min-h-12 border-dark-border/40 bg-transparent";
const SECTION_TITLE_CLASS = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70";
const CHECKBOX_CLASS =
  "size-5 border border-dark-border/40 bg-transparent data-[state=checked]:border-0 data-[state=checked]:border-transparent data-[state=checked]:bg-gradient data-[state=checked]:text-white";

const RULE_TYPE_VALUES = RULE_TYPE_OPTIONS as readonly string[];
const RULE_SEVERITY_VALUES = RULE_SEVERITY_OPTIONS as readonly string[];
const AGGREGATION_FUNCTION_VALUES = AGGREGATION_FUNCTION_OPTIONS.map((option) => option.value);

function isPositiveIntegerString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return false;
  }
  return Number(trimmed) >= 1;
}

function renderCustomSelectValueIfNeeded(value: string, options: readonly string[]) {
  if (!value || options.includes(value)) {
    return null;
  }

  return <SelectItem value={value}>{formatOptionLabel(value)} (custom)</SelectItem>;
}

function FormSectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-dark-border/60" />
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        <span className="h-px flex-1 bg-dark-border/60" />
        {action}
      </div>
    </div>
  );
}

export default function DetectionRulesTab({
  rules,
  rulesQuery,
  createRuleMutation,
  updateRuleMutation,
  deleteRuleMutation,
  testRuleMutation,
  isBusy,
  isRefreshing = false,
  isViewer = false,
  onViewerActionDenied,
}: DetectionRulesTabProps) {
  const [lookbackHours, setLookbackHours] = useState("24");
  const [maxEvents, setMaxEvents] = useState("1000");
  const [deleteRuleState, setDeleteRuleState] = useState<DetectionRuleApiRow | null>(null);

  const form = useForm<DetectionRuleFormValues, unknown, DetectionRuleFormValues>({
    resolver: zodResolver(detectionRuleFormSchema),
    defaultValues: getRuleDefaultValues(),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const { fields: conditionFields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditions",
    keyName: "keyId",
  });

  const ruleRows = useMemo(
    () => [...rules].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [rules],
  );

  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending;
  const formLocked = isBusy || isSaving || isRefreshing;
  const editingRuleId = form.watch("id");
  const isEditing = editingRuleId !== null;
  const rulesErrorMessage = getApiErrorMessage(rulesQuery.error, "Failed to load detection rules.");

  const isLookbackValid = useMemo(() => isPositiveIntegerString(lookbackHours), [lookbackHours]);
  const isMaxEventsValid = useMemo(() => isPositiveIntegerString(maxEvents), [maxEvents]);

  const resetRuleForm = () => {
    form.reset(getRuleDefaultValues());
    setLookbackHours("24");
    setMaxEvents("1000");
  };

  const setRuleFormFromRule = (rule: DetectionRuleApiRow) => {
    form.reset(mapRuleApiRowToFormValues(rule));
    scrollDetectionFormIntoView("detection-rule-form");
  };

  const denyViewerAction = () => {
    if (!isViewer) {
      return false;
    }
    onViewerActionDenied?.();
    return true;
  };

  const handleRuleSubmit = async (values: DetectionRuleFormValues) => {
    if (denyViewerAction()) {
      return;
    }

    const payload = buildRuleMutationPayload(values);

    if (values.id) {
      await updateRuleMutation.mutateAsync({ ruleId: values.id, payload });
    } else {
      await createRuleMutation.mutateAsync(payload);
    }

    resetRuleForm();
  };

  const handleRuleTest = async () => {
    if (denyViewerAction()) {
      return;
    }

    const isRuleFormValid = await form.trigger();
    if (!isRuleFormValid || !isLookbackValid || !isMaxEventsValid) {
      return;
    }

    const payload = buildRuleTestRequest(
      form.getValues(),
      Number(lookbackHours),
      Number(maxEvents),
    );

    await testRuleMutation.mutateAsync(payload);
  };

  const handleConfirmDelete = () => {
    if (!deleteRuleState) {
      return;
    }

    if (denyViewerAction()) {
      return;
    }

    const deletingRuleId = deleteRuleState.id;
    const isEditingDeletingRule = form.getValues("id") === deletingRuleId;

    deleteRuleMutation.mutate(deletingRuleId);

    if (isEditingDeletingRule) {
      resetRuleForm();
    }

    setDeleteRuleState(null);
  };

  return (
    <div className="space-y-4">
      <div id="detection-rule-form">
        <DashboardCardShell
          title={isEditing ? "Edit Detection Rule" : "Create Detection Rule"}
          description="Build deterministic detection logic with clear severity, conditions, and thresholds."
          headerRight={isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={resetRuleForm}
              disabled={formLocked}
            >
              <FiX className="size-4" />
              Cancel Edit
            </Button>
          ) : undefined}
          contentClassName="space-y-6"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => void handleRuleSubmit(values))}
              className="space-y-6"
            >
              <fieldset disabled={formLocked} className={cn("space-y-6", formLocked && "opacity-80")}>
                <FormSectionTitle
                  title="Rule Identity"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Rule Name
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Suspicious repeated Modbus write attempts"
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Priority
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="100" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Intent, owner, and expected response process..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormSectionTitle
                  title="Behavior Controls"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="rule_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Rule Type
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select rule type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            {renderCustomSelectValueIfNeeded(field.value, RULE_TYPE_VALUES)}
                            {RULE_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="cursor-pointer">
                                {formatOptionLabel(option)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logical_operator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Logical Operator
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select operator" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            <SelectItem value="AND" className="cursor-pointer">
                              AND - all conditions must match
                            </SelectItem>
                            <SelectItem value="OR" className="cursor-pointer">
                              OR - any condition can match
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="action_severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Severity
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            {renderCustomSelectValueIfNeeded(field.value, RULE_SEVERITY_VALUES)}
                            {RULE_SEVERITY_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="cursor-pointer">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="run_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Run Mode
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select run mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            <SelectItem value="active" className="cursor-pointer">
                              Active - fires alerts
                            </SelectItem>
                            <SelectItem value="shadow" className="cursor-pointer">
                              Shadow - observe only
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowlist_mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Allowlist Mode
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="reduce" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormSectionTitle
                  title="Detection Conditions"
                  action={(
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-9 cursor-pointer border-dashed"
                      onClick={() => {
                        if (denyViewerAction()) {
                          return;
                        }
                        append({ id: Date.now(), field: "", operator: "equals", value: "" });
                      }}
                      disabled={formLocked}
                    >
                      <FiPlus className="size-3.5" />
                      Add
                    </Button>
                  )}
                />

                <div className="space-y-3">
                  {conditionFields.map((conditionField, index) => (
                    <div
                      key={conditionField.keyId}
                      className="rounded-xl border border-dark-border/30 bg-dark-bg/40 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                          Condition {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => {
                            if (denyViewerAction()) {
                              return;
                            }
                            if (conditionFields.length > 1) {
                              remove(index);
                            }
                          }}
                          disabled={conditionFields.length === 1}
                        >
                          <FiTrash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_1fr]">
                        <FormField
                          control={form.control}
                          name={`conditions.${index}.field`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Field
                                {REQUIRED_STAR}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="classification" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`conditions.${index}.operator`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Operator
                                {REQUIRED_STAR}
                              </FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                                    <SelectValue placeholder="Select operator" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent
                                  className={ALLOWLIST_SELECT_CONTENT_CLASS}
                                  position="popper"
                                  align="start"
                                  side="bottom"
                                  sideOffset={4}
                                >
                                  {CONDITION_OPERATOR_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option} className="cursor-pointer">
                                      {formatOptionLabel(option)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`conditions.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Value
                                {REQUIRED_STAR}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="modbus or ['read','write']"
                                  className={cn(INPUT_CLASS, "font-mono text-sm")}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <FormSectionTitle
                  title="Advanced Controls"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="time_window_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (seconds)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="300" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="threshold_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Threshold Count</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="20" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aggregation_field"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aggregation Field</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="destination_port" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aggregation_function"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Aggregation Function
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select function" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            {renderCustomSelectValueIfNeeded(field.value, AGGREGATION_FUNCTION_VALUES)}
                            {AGGREGATION_FUNCTION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group_by_fields"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group By Fields</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="source_ip,destination_ip" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dedup_window_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dedup Window (seconds)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="300" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 lg:col-span-3">
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="detection_engine,modbus" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status{REQUIRED_STAR}</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              className={CHECKBOX_CLASS}
                            />
                            <span className="text-sm text-foreground">Active</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="override_on_high_confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Override allowlist on high confidence</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              className={CHECKBOX_CLASS}
                            />
                            <span className="text-sm text-foreground">Enabled</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    className="min-h-11 cursor-pointer bg-gradient text-white transition-all duration-200 hover:brightness-110"
                    disabled={formLocked}
                  >
                    <Spinner isLoading={isSaving} label="Saving...">
                      {isEditing ? "Save Changes" : "Create Rule"}
                    </Spinner>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 cursor-pointer"
                    onClick={resetRuleForm}
                    disabled={formLocked}
                  >
                    {isEditing ? "Cancel" : "Clear Draft"}
                  </Button>
                </div>

                <div className="rounded-xl border border-zcr-blue/20 bg-zcr-blue/5 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <FiActivity className="size-3.5 text-zcr-blue" />
                    <h3 className="text-sm font-semibold text-zcr-blue">Test Draft Against Live Data</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Lookback Hours</label>
                      <Input
                        value={lookbackHours}
                        onChange={(event) => setLookbackHours(event.target.value)}
                        placeholder="24"
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Max Events</label>
                      <Input
                        value={maxEvents}
                        onChange={(event) => setMaxEvents(event.target.value)}
                        placeholder="1000"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>

                  {(!isLookbackValid || !isMaxEventsValid) && (
                    <p className="text-xs text-amber-300/80">
                      Lookback hours and max events must be positive integers.
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer border-zcr-blue/30 text-zcr-blue hover:bg-zcr-blue/10! hover:text-zcr-blue-dark! transition-colors"
                      disabled={formLocked || testRuleMutation.isPending || !isLookbackValid || !isMaxEventsValid}
                      onClick={() => {
                        void handleRuleTest();
                      }}
                    >
                      <Spinner isLoading={testRuleMutation.isPending} label="Running test...">
                        <span className="flex items-center gap-1.5">
                          <FiActivity className="size-3.5" />
                          Run Test
                        </span>
                      </Spinner>
                    </Button>
                    {testRuleMutation.isPending && (
                      <p className="text-xs text-muted-foreground animate-pulse">Scanning events...</p>
                    )}
                  </div>

                  {testRuleMutation.data && (
                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                      {[
                        {
                          label: "Evaluated",
                          value: testRuleMutation.data.evaluated_events.toLocaleString(),
                        },
                        {
                          label: "Matched",
                          value: testRuleMutation.data.matched_events.toLocaleString(),
                        },
                        {
                          label: "Match Rate",
                          value: `${testRuleMutation.data.matched_ratio_percent}%`,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-zcr-blue/15 bg-dark-surface/60 px-4 py-3 text-center"
                        >
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                            {item.label}
                          </p>
                          <p className="text-xl font-semibold text-zcr-blue mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </fieldset>
            </form>
          </Form>
        </DashboardCardShell>
      </div>

      <DashboardCardShell
        title="Detection Rules"
        description={`${ruleRows.length} total rules`}
        contentClassName="space-y-3"
      >
        {rulesQuery.isLoading || isRefreshing ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton cols={6} rows={8} />
          </Table>
        ) : rulesQuery.isError ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="Unable to load detection rules"
                  description={rulesErrorMessage}
                  classesName="h-[140px] w-[180px]"
                  lottie="fail"
                />
              </div>
            </TableCaption>
          </Table>
        ) : ruleRows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="No detection rules found"
                  description="Create your first detection rule from the form above."
                  classesName="h-[140px] w-[180px]"
                />
              </div>
            </TableCaption>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruleRows.map((rule) => {
                const isEditingCurrentRow = editingRuleId === rule.id;

                return (
                  <TableRow
                    key={rule.id}
                    className={cn(
                      "transition-colors",
                      isEditingCurrentRow && "border-l-2 border-l-zcr-blue/60 bg-zcr-blue/6",
                    )}
                  >
                    <TableCell className="py-6 pl-6">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">Priority {rule.priority}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatOptionLabel(rule.rule_type)}
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="severity" value={rule.action_severity} />
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="status" value={rule.is_active ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTimeInBangkok(rule.updated_at)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            disabled={formLocked || deleteRuleMutation.isPending}
                          >
                            <HiOutlineDotsVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              if (denyViewerAction()) {
                                return;
                              }
                              setRuleFormFromRule(rule);
                            }}
                          >
                            <FiEdit2 className="size-4" />
                            Edit Rule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => {
                              if (denyViewerAction()) {
                                return;
                              }
                              setDeleteRuleState(rule);
                            }}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <MdDelete className="size-4" />
                            Delete Rule
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DashboardCardShell>

      <Dialog open={!!deleteRuleState} onOpenChange={(open) => !open && setDeleteRuleState(null)}>
        {deleteRuleState ? (
          <ConfirmModal
            title="Delete Rule Confirmation"
            description={`Are you sure you want to delete rule \"${deleteRuleState.name}\"? This action cannot be undone.`}
            isLoading={deleteRuleMutation.isPending}
            loadingLabel="Deleting..."
            onConfirm={handleConfirmDelete}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

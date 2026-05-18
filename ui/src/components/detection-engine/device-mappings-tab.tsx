import type { DetectionDeviceNameMappingMutationPayload } from "@/api/queries/detection-engine-queries";
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
import { type Resolver, useForm } from "react-hook-form";
import { FiEdit2, FiX } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { toast } from "sonner";
import { z } from "zod";
import {
  ALLOWLIST_SELECT_CONTENT_CLASS,
  ALLOWLIST_SELECT_TRIGGER_CLASS,
  buildDeviceMappingMutationPayload,
  DEVICE_MAPPING_TYPE_OPTIONS,
  getDeviceMappingDefaultValues,
  mapDeviceMappingApiRowToFormValues,
  scrollDetectionFormIntoView,
} from "./utils";
import { detectionDeviceMappingFormSchema } from "./validator";

type DeviceMappingsQueryState = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
};

type MutationState = { isPending: boolean };
type CreateDeviceMappingMutationState = MutationState & { mutateAsync: (payload: DetectionDeviceNameMappingMutationPayload) => Promise<unknown> };
type UpdateDeviceMappingMutationState = MutationState & { mutateAsync: (input: { mappingId: number; payload: DetectionDeviceNameMappingMutationPayload }) => Promise<unknown> };
type DeleteDeviceMappingMutationState = MutationState & { mutate: (mappingId: number) => void };
type DeviceMappingFormOutput = z.output<typeof detectionDeviceMappingFormSchema>;

interface DeviceMappingsTabProps {
  deviceMappings: DetectionDeviceNameMappingApiRow[];
  deviceMappingsQuery: DeviceMappingsQueryState;
  createDeviceMappingMutation: CreateDeviceMappingMutationState;
  updateDeviceMappingMutation: UpdateDeviceMappingMutationState;
  deleteDeviceMappingMutation: DeleteDeviceMappingMutationState;
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
const IP_DOT_VARIANTS_REGEX = /[。．｡]/g;
const WHITESPACE_REGEX = /\s+/g;
const INVISIBLE_IP_CHARS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;

function normalizeIpFieldInput(value: string): string {
  return value
    .replace(IP_DOT_VARIANTS_REGEX, ".")
    .replace(INVISIBLE_IP_CHARS_REGEX, "")
    .replace(WHITESPACE_REGEX, "")
    .trim();
}

function FormSectionTitle({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-dark-border/60" />
        <h3 className={SECTION_TITLE_CLASS}>{title}</h3>
        <span className="h-px flex-1 bg-dark-border/60" />
      </div>
    </div>
  );
}

function getMappingTypeLabel(mappingType: DetectionDeviceNameMappingApiRow["mapping_type"]): string {
  return mappingType === "ip" ? "IP Address" : "Modbus Unit ID";
}

function getMappingTarget(mapping: DetectionDeviceNameMappingApiRow): string {
  if (mapping.mapping_type === "ip") {
    return mapping.ip_address || "-";
  }

  if (mapping.unit_id === null) {
    return "-";
  }

  return `Unit ${mapping.unit_id}`;
}

export default function DeviceMappingsTab({
  deviceMappings,
  deviceMappingsQuery,
  createDeviceMappingMutation,
  updateDeviceMappingMutation,
  deleteDeviceMappingMutation,
  isBusy,
  isRefreshing = false,
  isViewer = false,
  onViewerActionDenied,
}: DeviceMappingsTabProps) {
  const [deleteMappingState, setDeleteMappingState] = useState<DetectionDeviceNameMappingApiRow | null>(null);

  const form = useForm<DetectionDeviceMappingFormValues, unknown, DeviceMappingFormOutput>({
    resolver: zodResolver(detectionDeviceMappingFormSchema) as Resolver<
      DetectionDeviceMappingFormValues,
      unknown,
      DeviceMappingFormOutput
    >,
    defaultValues: getDeviceMappingDefaultValues(),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const mappingRows = useMemo(
    () => [...deviceMappings].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [deviceMappings],
  );

  const isSaving = createDeviceMappingMutation.isPending || updateDeviceMappingMutation.isPending;
  const formLocked = isBusy || isSaving || isRefreshing;
  const isEditing = form.watch("id") !== null;
  const mappingType = form.watch("mapping_type");
  const mappingsErrorMessage = getApiErrorMessage(deviceMappingsQuery.error, "Failed to load device mappings.");

  const resetForm = () => {
    form.reset(getDeviceMappingDefaultValues());
  };

  const setFormFromMapping = (mapping: DetectionDeviceNameMappingApiRow) => {
    form.reset(mapDeviceMappingApiRowToFormValues(mapping));
    scrollDetectionFormIntoView("detection-device-mapping-form");
  };

  const denyViewerAction = () => {
    if (!isViewer) {
      return false;
    }
    onViewerActionDenied?.();
    return true;
  };

  const getFirstFormErrorMessage = (errorNode: unknown): string | null => {
    if (!errorNode || typeof errorNode !== "object") {
      return null;
    }

    if ("message" in errorNode && typeof (errorNode as { message?: unknown }).message === "string") {
      const message = (errorNode as { message: string }).message.trim();
      return message || null;
    }

    for (const value of Object.values(errorNode as Record<string, unknown>)) {
      const nestedMessage = getFirstFormErrorMessage(value);
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return null;
  };

  const handleInvalidSubmit = () => {
    const message = getFirstFormErrorMessage(form.formState.errors)
      || "Please check required fields and try again.";
    toast.error("Unable to submit mapping", { description: message });
  };

  const handleMappingTypeChange = (value: "ip" | "modbus_unit") => {
    form.setValue("mapping_type", value, { shouldDirty: true, shouldValidate: true });

    if (value === "ip") {
      form.setValue("unit_id", "", { shouldDirty: true, shouldValidate: true });
      form.clearErrors("unit_id");
      return;
    }

    form.setValue("ip_address", "", { shouldDirty: true, shouldValidate: true });
    form.clearErrors("ip_address");
  };

  const handleSubmit = async (values: DeviceMappingFormOutput) => {
    if (denyViewerAction()) {
      return;
    }

    const payload = buildDeviceMappingMutationPayload(values);

    try {
      if (values.id) {
        await updateDeviceMappingMutation.mutateAsync({ mappingId: values.id, payload });
      } else {
        await createDeviceMappingMutation.mutateAsync(payload);
      }

      resetForm();
    } catch {
      // Errors are handled by mutation onError toasts; keep form values for user correction.
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteMappingState) {
      return;
    }

    if (denyViewerAction()) {
      return;
    }

    const deletingMappingId = deleteMappingState.id;
    const isEditingDeletingMapping = form.getValues("id") === deletingMappingId;

    deleteDeviceMappingMutation.mutate(deletingMappingId);

    if (isEditingDeletingMapping) {
      resetForm();
    }

    setDeleteMappingState(null);
  };

  return (
    <div className="space-y-4">
      <div id="detection-device-mapping-form">
        <DashboardCardShell
          title={isEditing ? "Edit Device Mapping" : "Create Device Mapping"}
          description="Map IP addresses and Modbus unit IDs to clear device names used across detections."
          headerRight={isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={resetForm}
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
              onSubmit={form.handleSubmit(
                (values) => void handleSubmit(values),
                () => handleInvalidSubmit(),
              )}
              className="space-y-6"
            >
              <fieldset disabled={formLocked} className={cn("space-y-6", formLocked && "opacity-80")}>
                <FormSectionTitle title="Mapping Scope" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="mapping_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Mapping Type
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => handleMappingTypeChange(value as "ip" | "modbus_unit")}
                        >
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select mapping type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            {DEVICE_MAPPING_TYPE_OPTIONS.map((option) => (
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

                  {mappingType === "ip" ? (
                    <FormField
                      control={form.control}
                      name="ip_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            IP Address
                            {REQUIRED_STAR}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onBlur={(event) => {
                                field.onBlur();
                                const normalizedIp = normalizeIpFieldInput(event.target.value ?? "");
                                if (normalizedIp !== (field.value ?? "")) {
                                  form.setValue("ip_address", normalizedIp, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
                              placeholder="10.40.20.42"
                              className={cn(INPUT_CLASS, "font-mono text-sm")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="unit_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Modbus Unit ID
                            {REQUIRED_STAR}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="11"
                              className={cn(INPUT_CLASS, "font-mono text-sm")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormSectionTitle title="Display Configuration" />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Display Name
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="EV Charger A"
                            className={INPUT_CLASS}
                          />
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
                            value={field.value ?? ""}
                            rows={3}
                            placeholder="Optional context for this mapping"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormSectionTitle title="Status" />

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

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    className="min-h-11 cursor-pointer bg-gradient text-white transition-all duration-200 hover:brightness-110"
                    disabled={formLocked}
                    onClick={(event) => {
                      if (!denyViewerAction()) {
                        return;
                      }
                      event.preventDefault();
                    }}
                  >
                    <Spinner isLoading={isSaving} label="Saving...">
                      {isEditing ? "Save Changes" : "Create Mapping"}
                    </Spinner>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 cursor-pointer"
                    onClick={resetForm}
                    disabled={formLocked}
                  >
                    {isEditing ? "Cancel" : "Clear Draft"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </DashboardCardShell>
      </div>

      <DashboardCardShell
        title="Device Mappings"
        description={`${mappingRows.length} total mappings`}
        contentClassName="space-y-3"
      >
        {deviceMappingsQuery.isLoading || isRefreshing ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton cols={6} rows={8} />
          </Table>
        ) : deviceMappingsQuery.isError ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="Unable to load device mappings"
                  description={mappingsErrorMessage}
                  classesName="h-[140px] w-[180px]"
                  lottie="fail"
                />
              </div>
            </TableCaption>
          </Table>
        ) : mappingRows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="No device mappings found"
                  description="Create your first device mapping from the form above."
                  classesName="h-[140px] w-[180px]"
                />
              </div>
            </TableCaption>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappingRows.map((mapping) => {
                const editingCurrentRow = form.getValues("id") === mapping.id;

                return (
                  <TableRow
                    key={mapping.id}
                    className={cn(
                      "transition-colors",
                      editingCurrentRow && "border-l-2 border-l-zcr-blue/60 bg-zcr-blue/6",
                    )}
                  >
                    <TableCell className="py-6 pl-6 text-muted-foreground">
                      {getMappingTypeLabel(mapping.mapping_type)}
                    </TableCell>
                    <TableCell className="py-6 font-mono text-xs text-foreground/85">
                      {getMappingTarget(mapping)}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{mapping.display_name}</p>
                        {mapping.description && (
                          <p className="max-w-72 truncate text-xs text-muted-foreground/70">{mapping.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="status" value={mapping.is_active ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTimeInBangkok(mapping.updated_at)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            disabled={formLocked || deleteDeviceMappingMutation.isPending}
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
                              setFormFromMapping(mapping);
                            }}
                            disabled={formLocked}
                          >
                            <FiEdit2 className="size-4" />
                            Edit Mapping
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => {
                              if (denyViewerAction()) {
                                return;
                              }
                              setDeleteMappingState(mapping);
                            }}
                            disabled={deleteDeviceMappingMutation.isPending}
                          >
                            <MdDelete className="size-4" />
                            Delete Mapping
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

      <Dialog open={!!deleteMappingState} onOpenChange={(open) => !open && setDeleteMappingState(null)}>
        {deleteMappingState ? (
          <ConfirmModal
            title="Delete Device Mapping Confirmation"
            description={`Are you sure you want to delete mapping "${deleteMappingState.display_name}"? This action cannot be undone.`}
            isLoading={deleteDeviceMappingMutation.isPending}
            loadingLabel="Deleting..."
            onConfirm={handleConfirmDelete}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

import type { DetectionAllowlistMutationPayload } from "@/api/queries/detection-engine-queries";
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
import {
  ALLOWLIST_SELECT_CONTENT_CLASS,
  ALLOWLIST_SELECT_TRIGGER_CLASS,
  buildAllowlistMutationPayload,
  CLASSIFICATION_OPTIONS,
  DIRECTION_OPTIONS,
  formatOptionLabel,
  getAllowlistDefaultValues,
  mapAllowlistApiRowToFormValues,
  SCENARIO_TYPE_OPTIONS,
  scrollDetectionFormIntoView,
} from "./utils";
import { detectionAllowlistFormSchema } from "./validator";

type AllowlistsQueryState = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
};

type MutationState = { isPending: boolean };
type CreateAllowlistMutationState = MutationState & { mutateAsync: (payload: DetectionAllowlistMutationPayload) => Promise<unknown> };
type UpdateAllowlistMutationState = MutationState & { mutateAsync: (input: { scopeId: number; payload: DetectionAllowlistMutationPayload }) => Promise<unknown> };
type DeleteAllowlistMutationState = MutationState & { mutate: (scopeId: number) => void };

interface AllowListsTabProps {
  allowlists: DetectionAllowlistApiRow[];
  allowlistsQuery: AllowlistsQueryState;
  createAllowlistMutation: CreateAllowlistMutationState;
  updateAllowlistMutation: UpdateAllowlistMutationState;
  deleteAllowlistMutation: DeleteAllowlistMutationState;
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

function renderCustomSelectValueIfNeeded(value: string, options: readonly string[]) {
  if (!value || options.includes(value)) {
    return null;
  }

  return <SelectItem value={value}>{formatOptionLabel(value)} (custom)</SelectItem>;
}

function FormSectionTitle({
  title,
}: {
  title: string;
}) {
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

export default function AllowListsTab({
  allowlists,
  allowlistsQuery,
  createAllowlistMutation,
  updateAllowlistMutation,
  deleteAllowlistMutation,
  isBusy,
  isRefreshing = false,
  isViewer = false,
  onViewerActionDenied,
}: AllowListsTabProps) {
  const [deleteAllowlistState, setDeleteAllowlistState] = useState<DetectionAllowlistApiRow | null>(null);

  const form = useForm<DetectionAllowlistFormValues, unknown, DetectionAllowlistFormValues>({
    resolver: zodResolver(detectionAllowlistFormSchema) as Resolver<DetectionAllowlistFormValues>,
    defaultValues: getAllowlistDefaultValues(),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const allowlistRows = useMemo(
    () => [...allowlists].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [allowlists],
  );

  const isSaving = createAllowlistMutation.isPending || updateAllowlistMutation.isPending;
  const formLocked = isBusy || isSaving || isRefreshing;
  const isEditing = form.watch("id") !== null;
  const allowlistsErrorMessage = getApiErrorMessage(
    allowlistsQuery.error,
    "Failed to load allow lists.",
  );

  const resetAllowlistForm = () => {
    form.reset(getAllowlistDefaultValues());
  };

  const setAllowlistFormFromScope = (item: DetectionAllowlistApiRow) => {
    form.reset(mapAllowlistApiRowToFormValues(item));
    scrollDetectionFormIntoView("detection-allowlist-form");
  };

  const denyViewerAction = () => {
    if (!isViewer) {
      return false;
    }
    onViewerActionDenied?.();
    return true;
  };

  const handleAllowlistSubmit = async (values: DetectionAllowlistFormValues) => {
    if (denyViewerAction()) {
      return;
    }

    const payload = buildAllowlistMutationPayload(values);

    if (values.id) {
      await updateAllowlistMutation.mutateAsync({ scopeId: values.id, payload });
    } else {
      await createAllowlistMutation.mutateAsync(payload);
    }

    resetAllowlistForm();
  };

  const handleConfirmDelete = () => {
    if (!deleteAllowlistState) {
      return;
    }

    if (denyViewerAction()) {
      return;
    }

    const deletingScopeId = deleteAllowlistState.id;
    const isEditingDeletingScope = form.getValues("id") === deletingScopeId;

    deleteAllowlistMutation.mutate(deletingScopeId);

    if (isEditingDeletingScope) {
      resetAllowlistForm();
    }

    setDeleteAllowlistState(null);
  };

  return (
    <div className="space-y-4">
      <div id="detection-allowlist-form">
        <DashboardCardShell
          title={isEditing ? "Edit Allow List" : "Create Allow List"}
          description="Define allow-list boundaries with flexible optional scope fields."
          headerRight={isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={resetAllowlistForm}
              disabled={formLocked}
            >
              <FiX className="size-4" />
              Cancel Edit
            </Button>
          ) : undefined}
          contentClassName="space-y-6"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => void handleAllowlistSubmit(values))} className="space-y-6">
              <fieldset disabled={formLocked} className={cn("space-y-6", formLocked && "opacity-80")}>
                <FormSectionTitle title="Identity" />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Smartlogger maintenance baseline" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="modbus" className={INPUT_CLASS} />
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
                          <Textarea {...field} rows={3} placeholder="Short context for this allow list"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormSectionTitle title="Traffic Scope" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="source_ip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Source IP
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10.20.30.40" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source_cidr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source CIDR</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10.20.30.0/24" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination_ip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination IP</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10.50.60.70" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination_cidr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination CIDR</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="10.50.60.0/24" className={cn(INPUT_CLASS, "font-mono text-sm")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={ALLOWLIST_SELECT_CONTENT_CLASS} position="popper" align="start" side="bottom" sideOffset={4}>
                            {renderCustomSelectValueIfNeeded(field.value, DIRECTION_OPTIONS)}
                            {DIRECTION_OPTIONS.map((option) => (
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
                    name="classification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classification</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={ALLOWLIST_SELECT_CONTENT_CLASS} position="popper" align="start" side="bottom" sideOffset={4}>
                            {renderCustomSelectValueIfNeeded(field.value, CLASSIFICATION_OPTIONS)}
                            {CLASSIFICATION_OPTIONS.map((option) => (
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
                    name="scenario_type"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-3">
                        <FormLabel>Scenario Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select scenario type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={ALLOWLIST_SELECT_CONTENT_CLASS} position="popper" align="start" side="bottom" sideOffset={4}>
                            {renderCustomSelectValueIfNeeded(field.value, SCENARIO_TYPE_OPTIONS)}
                            {SCENARIO_TYPE_OPTIONS.map((option) => (
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
                </div>

                <FormSectionTitle title="Operational Controls" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="destination_port_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port Start</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="502" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination_port_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port End</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="502" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_matches_per_hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Matches / Hour</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="120" className={INPUT_CLASS} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="CR reference, owner, review timeline"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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
                  >
                    <Spinner isLoading={isSaving} label="Saving...">
                      {isEditing ? "Save Changes" : "Create Allow List"}
                    </Spinner>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 cursor-pointer"
                    onClick={resetAllowlistForm}
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
        title="Allow Lists"
        description={`${allowlistRows.length} total entries`}
        contentClassName="space-y-3"
      >
        {allowlistsQuery.isLoading || isRefreshing ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton cols={5} rows={8} />
          </Table>
        ) : allowlistsQuery.isError ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="Unable to load allow lists"
                  description={allowlistsErrorMessage}
                  classesName="h-[140px] w-[180px]"
                  lottie="fail"
                />
              </div>
            </TableCaption>
          </Table>
        ) : allowlistRows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="No allow lists found"
                  description="Create your first allow list from the form above."
                  classesName="h-[140px] w-[180px]"
                />
              </div>
            </TableCaption>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allowlistRows.map((item) => {
                const source = item.source_ip || item.source_cidr || "-";
                const destination = item.destination_ip || item.destination_cidr || "-";
                const portRange = item.destination_port_start || item.destination_port_end
                  ? `:${item.destination_port_start ?? "*"}-${item.destination_port_end ?? "*"}`
                  : "";
                const editingCurrentRow = form.getValues("id") === item.id;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "transition-colors",
                      editingCurrentRow && "border-l-2 border-l-zcr-blue/60 bg-zcr-blue/6",
                    )}
                  >
                    <TableCell className="py-6 pl-6">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="max-w-52 truncate text-xs text-muted-foreground/70">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <p className="font-mono text-xs text-foreground/80">{source} → {destination}{portRange}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/65">
                        {item.direction || "-"} · {item.protocol || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="status" value={item.is_active ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTimeInBangkok(item.updated_at)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            disabled={formLocked || deleteAllowlistMutation.isPending}
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
                              setAllowlistFormFromScope(item);
                            }}
                            disabled={formLocked}
                          >
                            <FiEdit2 className="size-4" />
                            Edit Allow List
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => {
                              if (denyViewerAction()) {
                                return;
                              }
                              setDeleteAllowlistState(item);
                            }}
                            disabled={deleteAllowlistMutation.isPending}
                          >
                            <MdDelete className="size-4" />
                            Delete Allow List
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

      <Dialog open={!!deleteAllowlistState} onOpenChange={(open) => !open && setDeleteAllowlistState(null)}>
        {deleteAllowlistState ? (
          <ConfirmModal
            title="Delete Allow List Confirmation"
            description={`Are you sure you want to delete allow list \"${deleteAllowlistState.name}\"? This action cannot be undone.`}
            isLoading={deleteAllowlistMutation.isPending}
            loadingLabel="Deleting..."
            onConfirm={handleConfirmDelete}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

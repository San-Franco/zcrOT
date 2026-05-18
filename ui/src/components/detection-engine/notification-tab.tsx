import type { DetectionNotificationPolicyMutationPayload } from "@/api/queries/detection-engine-queries";
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
  buildNotificationPolicyMutationPayload,
  formatOptionLabel,
  getNotificationPolicyDefaultValues,
  mapNotificationPolicyApiRowToFormValues,
  NOTIFICATION_CHANNEL_OPTIONS,
  NOTIFICATION_SEVERITY_OPTIONS,
  scrollDetectionFormIntoView,
} from "./utils";
import { detectionNotificationPolicyFormSchema } from "./validator";

type NotificationPoliciesQueryState = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
};

type MutationState = { isPending: boolean };
type CreateNotificationPolicyMutationState = MutationState & { mutateAsync: (payload: DetectionNotificationPolicyMutationPayload) => Promise<unknown> };
type UpdateNotificationPolicyMutationState = MutationState & { mutateAsync: (input: { policyId: number; payload: DetectionNotificationPolicyMutationPayload }) => Promise<unknown> };
type DeleteNotificationPolicyMutationState = MutationState & { mutate: (policyId: number) => void };

interface NotificationTabProps {
  notificationPolicies: DetectionNotificationPolicyApiRow[];
  notificationPoliciesQuery: NotificationPoliciesQueryState;
  createNotificationPolicyMutation: CreateNotificationPolicyMutationState;
  updateNotificationPolicyMutation: UpdateNotificationPolicyMutationState;
  deleteNotificationPolicyMutation: DeleteNotificationPolicyMutationState;
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

export default function NotificationTab({
  notificationPolicies,
  notificationPoliciesQuery,
  createNotificationPolicyMutation,
  updateNotificationPolicyMutation,
  deleteNotificationPolicyMutation,
  isBusy,
  isRefreshing = false,
  isViewer = false,
  onViewerActionDenied,
}: NotificationTabProps) {
  const [deletePolicyState, setDeletePolicyState] = useState<DetectionNotificationPolicyApiRow | null>(null);

  const form = useForm<DetectionNotificationPolicyFormValues, unknown, DetectionNotificationPolicyFormValues>({
    resolver: zodResolver(detectionNotificationPolicyFormSchema) as Resolver<DetectionNotificationPolicyFormValues>,
    defaultValues: getNotificationPolicyDefaultValues(),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const policyRows = useMemo(
    () => [...notificationPolicies].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [notificationPolicies],
  );

  const isSaving = createNotificationPolicyMutation.isPending || updateNotificationPolicyMutation.isPending;
  const formLocked = isBusy || isSaving || isRefreshing;
  const isEditing = form.watch("id") !== null;
  const policiesErrorMessage = getApiErrorMessage(
    notificationPoliciesQuery.error,
    "Failed to load notification policies.",
  );

  const resetPolicyForm = () => {
    form.reset(getNotificationPolicyDefaultValues());
  };

  const setPolicyFormFromPolicy = (policy: DetectionNotificationPolicyApiRow) => {
    form.reset(mapNotificationPolicyApiRowToFormValues(policy));
    scrollDetectionFormIntoView("detection-notification-policy-form");
  };

  const denyViewerAction = () => {
    if (!isViewer) {
      return false;
    }
    onViewerActionDenied?.();
    return true;
  };

  const handleSubmit = async (values: DetectionNotificationPolicyFormValues) => {
    if (denyViewerAction()) {
      return;
    }

    const payload = buildNotificationPolicyMutationPayload(values);

    if (values.id) {
      await updateNotificationPolicyMutation.mutateAsync({ policyId: values.id, payload });
    } else {
      await createNotificationPolicyMutation.mutateAsync(payload);
    }

    resetPolicyForm();
  };

  const handleConfirmDelete = () => {
    if (!deletePolicyState) {
      return;
    }

    if (denyViewerAction()) {
      return;
    }

    const deletingPolicyId = deletePolicyState.id;
    const isEditingDeletingPolicy = form.getValues("id") === deletingPolicyId;

    deleteNotificationPolicyMutation.mutate(deletingPolicyId);

    if (isEditingDeletingPolicy) {
      resetPolicyForm();
    }

    setDeletePolicyState(null);
  };

  return (
    <div className="space-y-4">
      <div id="detection-notification-policy-form">
        <DashboardCardShell
          title={isEditing ? "Edit Notification Policy" : "Create Notification Policy"}
          description="Define summary notification rules with channel, severity, cadence, and activation state."
          headerRight={isEditing ? (
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={resetPolicyForm}
              disabled={formLocked}
            >
              <FiX className="size-4" />
              Cancel Edit
            </Button>
          ) : undefined}
          contentClassName="space-y-6"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => void handleSubmit(values))} className="space-y-6">
              <fieldset disabled={formLocked} className={cn("space-y-6", formLocked && "opacity-80")}>
                <FormSectionTitle title="Policy Basics" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Policy Name
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="SOC hourly incident summary"
                            className={INPUT_CLASS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Channel
                          {REQUIRED_STAR}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={ALLOWLIST_SELECT_TRIGGER_CLASS}>
                              <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent
                            className={ALLOWLIST_SELECT_CONTENT_CLASS}
                            position="popper"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            {NOTIFICATION_CHANNEL_OPTIONS.map((option) => (
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
                    name="min_severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Min Severity
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
                            {NOTIFICATION_SEVERITY_OPTIONS.map((severity) => (
                              <SelectItem key={severity} value={severity} className="cursor-pointer">
                                {severity}
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
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Who receives this summary and why"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormSectionTitle title="Dispatch Controls" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Event Type
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="incident.created"
                            className={cn(INPUT_CLASS, "font-mono text-sm")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="throttle_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Summary Period (Seconds)
                          {REQUIRED_STAR}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="300"
                            className={cn(INPUT_CLASS, "font-mono text-sm")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="text-xs text-muted-foreground/75 md:col-span-2">
                    Recipient email is automatically set to the current user; target is not manually editable.
                  </p>
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
                  >
                    <Spinner isLoading={isSaving} label="Saving...">
                      {isEditing ? "Save Changes" : "Create Policy"}
                    </Spinner>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 cursor-pointer"
                    onClick={resetPolicyForm}
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
        title="Notification Policies"
        description={`${policyRows.length} total policies`}
        contentClassName="space-y-3"
      >
        {notificationPoliciesQuery.isLoading || isRefreshing ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton cols={8} rows={8} />
          </Table>
        ) : notificationPoliciesQuery.isError ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="Unable to load notification policies"
                  description={policiesErrorMessage}
                  classesName="h-[140px] w-[180px]"
                  lottie="fail"
                />
              </div>
            </TableCaption>
          </Table>
        ) : policyRows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="No notification policies found"
                  description="Create your first notification policy from the form above."
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
                <TableHead>Channel</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policyRows.map((policy) => {
                const editingCurrentRow = form.getValues("id") === policy.id;

                return (
                  <TableRow
                    key={policy.id}
                    className={cn(
                      "transition-colors",
                      editingCurrentRow && "border-l-2 border-l-zcr-blue/60 bg-zcr-blue/6",
                    )}
                  >
                    <TableCell className="py-6 pl-6">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{policy.name}</p>
                        {policy.description && (
                          <p className="max-w-72 truncate text-xs text-muted-foreground/70">{policy.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatOptionLabel(policy.channel)}
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="severity" value={policy.min_severity} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground/85">
                      {policy.event_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground/85">
                      {policy.throttle_seconds}s
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="status" value={policy.is_active ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDateTimeInBangkok(policy.updated_at)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            disabled={formLocked || deleteNotificationPolicyMutation.isPending}
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
                              setPolicyFormFromPolicy(policy);
                            }}
                            disabled={formLocked}
                          >
                            <FiEdit2 className="size-4" />
                            Edit Policy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => {
                              if (denyViewerAction()) {
                                return;
                              }
                              setDeletePolicyState(policy);
                            }}
                            disabled={deleteNotificationPolicyMutation.isPending}
                          >
                            <MdDelete className="size-4" />
                            Delete Policy
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

      <Dialog open={!!deletePolicyState} onOpenChange={(open) => !open && setDeletePolicyState(null)}>
        {deletePolicyState ? (
          <ConfirmModal
            title="Delete Notification Policy Confirmation"
            description={`Are you sure you want to delete policy "${deletePolicyState.name}"? This action cannot be undone.`}
            isLoading={deleteNotificationPolicyMutation.isPending}
            loadingLabel="Deleting..."
            onConfirm={handleConfirmDelete}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

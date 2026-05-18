import { detectionIncidentEventsInfiniteQuery } from "@/api/queries/detection-engine-queries";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import Spinner from "@/components/shared/spinner";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatOtHostLabel, formatRiskScore, getApiErrorMessage, isExternalSourceIp } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FiActivity, FiShield } from "react-icons/fi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { formatDateTimeInBangkok } from "@/lib/utils";
import { BsFileEarmarkText } from "react-icons/bs";

type IncidentMutationState = {
  isPending: boolean;
  mutate: (incidentKey: string) => void;
};

type IncidentEventsModalProps = {
  incident: DetectionIncidentApiRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ackIncidentMutation: IncidentMutationState;
  closeIncidentMutation: IncidentMutationState;
  reopenIncidentMutation: IncidentMutationState;
  isViewer?: boolean;
  onViewerActionDenied?: () => void;
};

function getRiskColorClass(score: number) {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-amber-400";
  if (score >= 25) return "text-blue-400";
  return "text-emerald-400";
}

function getRiskPillClass(score: number) {
  if (score >= 75) return "bg-red-500/15 text-red-300 ring-red-500/25";
  if (score >= 50) return "bg-amber-500/15 text-amber-300 ring-amber-500/25";
  if (score >= 25) return "bg-blue-500/15 text-blue-300 ring-blue-500/25";
  return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25";
}

const EVENT_TABLE_HEADERS = [
  { label: "Timestamp", className: "min-w-[140px]" },
  { label: "Source", className: "min-w-[110px]" },
  { label: "Destination", className: "min-w-[110px]" },
  { label: "Protocol", className: "min-w-[80px]" },
  { label: "Identity", className: "min-w-[90px]" },
  { label: "Severity", className: "min-w-[80px]" },
  { label: "Verdict", className: "min-w-[80px]" },
  { label: "Risk", className: "min-w-[70px] text-right" },
  { label: "Message", className: "min-w-[200px]" },
];

export default function IncidentEventsModal({
  incident,
  open,
  onOpenChange,
  ackIncidentMutation,
  closeIncidentMutation,
  reopenIncidentMutation,
  isViewer = false,
  onViewerActionDenied,
}: IncidentEventsModalProps) {
  const incidentId = incident?.id ?? "";

  const incidentEventsQuery = useInfiniteQuery({
    ...detectionIncidentEventsInfiniteQuery({ incidentId, limit: 25 }),
    enabled: open && Boolean(incidentId),
  });

  const incidentDetails = useMemo(
    () => incident ?? incidentEventsQuery.data?.pages[0]?.incident ?? null,
    [incident, incidentEventsQuery.data?.pages],
  );

  const incidentEvents = useMemo(
    () => incidentEventsQuery.data?.pages.flatMap((page) => page.rows) ?? [],
    [incidentEventsQuery.data?.pages],
  );

  const totalEvents =
    incidentEventsQuery.data?.pages[0]?.total ?? incidentDetails?.event_count ?? 0;

  const isLoading = incidentEventsQuery.status === "pending";
  const isError = incidentEventsQuery.status === "error";
  const hasMoreEvents = incidentEventsQuery.hasNextPage ?? false;
  const isLoadingMoreEvents = incidentEventsQuery.isFetchingNextPage;
  const errorMessage = getApiErrorMessage(
    incidentEventsQuery.error,
    "Unable to load this incident's mapped events right now.",
  );

  const showStatusActions =
    incidentDetails?.status === "open" || incidentDetails?.status === "ack";

  const denyViewerAction = () => {
    if (!isViewer) {
      return false;
    }
    onViewerActionDenied?.();
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Max width ~1520px so the table has real room to breathe.
        Fixed height with a three-zone layout: pinned header / scrolling body / pinned footer.
      */}
      <DialogContent
        className={cn(
          "z-999 flex flex-col gap-0 overflow-hidden p-0",
          "w-[98vw] max-w-380! sm:max-w-380!",
          "h-[min(90vh,860px)]",
          "border border-dark-border/40",
          "bg-linear-to-br from-dark-surface via-dark-surface/98 to-dark-bg",
        )}
      >
        {/* ── PINNED HEADER ─────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-dark-border/30 px-7 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-slate-100">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zcr-blue/15 ring-1 ring-zcr-blue/30">
                <BsFileEarmarkText className="size-3.5 text-zcr-blue" />
              </span>
              Incident Details
            </DialogTitle>
            <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground/65">
              <span>
                Key:{" "}
                <span className="font-mono text-slate-300/90">
                  {incidentDetails?.incident_key ?? "—"}
                </span>
              </span>
              {incidentDetails && (
                <span>
                  Updated:{" "}
                  <span className="text-slate-300/90">
                    {formatDateTimeInBangkok(incidentDetails.updated_at)}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* ── SCROLLABLE BODY ───────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 no-scrollbar">
          {incidentDetails ? (
            <div className="space-y-6">

              {/* KPI strip — 6 columns, all equal height */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:grid-cols-6">
                {[
                  {
                    label: "Status",
                    node: (
                      <div className="mt-1.5">
                        <CustomBadge kind="status" value={incidentDetails.status} />
                      </div>
                    ),
                  },
                  {
                    label: "Severity",
                    node: (
                      <div className="mt-1.5">
                        <CustomBadge kind="severity" value={incidentDetails.severity} />
                      </div>
                    ),
                  },
                  {
                    label: "Events",
                    node: (
                      <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-slate-100">
                        {totalEvents}
                      </p>
                    ),
                  },
                  {
                    label: "Matches",
                    node: (
                      <p className="mt-1.5 text-2xl font-bold tabular-nums leading-none text-slate-100">
                        {incidentDetails.match_count}
                      </p>
                    ),
                  },
                  {
                    label: "Max Risk",
                    node: (
                      <p
                        className={cn(
                          "mt-1.5 text-2xl font-bold tabular-nums leading-none",
                          getRiskColorClass(incidentDetails.max_risk_score),
                        )}
                      >
                        {formatRiskScore(incidentDetails.max_risk_score)}
                      </p>
                    ),
                  },
                  {
                    label: "Last Seen",
                    node: (
                      <p className="mt-1.5 text-sm font-medium leading-snug text-slate-200">
                        {formatDateTimeInBangkok(incidentDetails.last_seen)}
                      </p>
                    ),
                  },
                ].map(({ label, node }) => (
                  <div
                    key={label}
                    className="flex min-h-20.5 flex-col justify-between rounded-xl border border-dark-border/35 bg-dark-surface/50 px-4 py-3.5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {label}
                    </p>
                    {node}
                  </div>
                ))}
              </div>

              {/* Events table section */}
              <div className="overflow-hidden rounded-xl border border-dark-border/35 bg-dark-surface/30">

                {/* Section header */}
                <div className="flex items-center gap-2.5 border-b border-dark-border/25 px-5 py-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zcr-blue/10">
                    <FiActivity className="size-3 text-zcr-blue" />
                  </span>
                  <span className="text-sm font-semibold text-slate-200">Incident Events</span>
                  {!isLoading && !isError && (
                    <span className="ml-auto rounded-full bg-dark-border/25 px-2.5 py-0.5 text-[11px] tabular-nums text-muted-foreground/70">
                      {incidentEvents.length}
                      {totalEvents > incidentEvents.length ? ` of ${totalEvents}` : ""}
                    </span>
                  )}
                </div>

                {/* Horizontally scrollable table */}
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-dark-border/25 bg-dark-surface/60 hover:bg-dark-surface/60">
                        {EVENT_TABLE_HEADERS.map(({ label, className }) => (
                          <TableHead
                            key={label}
                            className={cn(
                              "whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50",
                              className,
                            )}
                          >
                            {label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    {isLoading ? (
                      <TableSkeleton cols={9} rows={10} />
                    ) : isError ? (
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={9} className="py-14 text-center">
                            <Empty
                              label="Failed to load events"
                              description={errorMessage}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 cursor-pointer text-xs"
                              onClick={() => { void incidentEventsQuery.refetch(); }}
                            >
                              Retry
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    ) : incidentEvents.length === 0 ? (
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={9} className="py-14 text-center">
                            <Empty
                              label="No events"
                              description="This incident has no mapped events yet."
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    ) : (
                      <TableBody>
                        {incidentEvents.map((event) => {
                          const identity = isExternalSourceIp(event.source_ip)
                            ? "external"
                            : event.unknown_client
                              ? "unknown"
                              : "known";

                          return (
                            <TableRow
                              key={event.id}
                              className="border-dark-border/20 transition-colors hover:bg-dark-surface/40"
                            >
                              <TableCell className="whitespace-nowrap text-xs py-4 text-muted-foreground/75">
                                {formatDateTimeInBangkok(event.event_time)}
                              </TableCell>
                              <TableCell
                                className="text-xs text-slate-300"
                                title={event.source_ip}
                              >
                                {formatOtHostLabel(event.source_ip)}
                              </TableCell>
                              <TableCell
                                className="text-xs text-slate-300"
                                title={event.destination_ip}
                              >
                                {formatOtHostLabel(event.destination_ip)}
                              </TableCell>
                              <TableCell className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                                {event.protocol || "—"}
                              </TableCell>
                              <TableCell>
                                <CustomBadge kind="identity" value={identity} />
                              </TableCell>
                              <TableCell>
                                <CustomBadge kind="severity" value={event.severity} />
                              </TableCell>
                              <TableCell>
                                <CustomBadge kind="verdict" value={event.verdict} />
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1",
                                    getRiskPillClass(event.risk_score),
                                  )}
                                >
                                  {formatRiskScore(event.risk_score)}
                                </span>
                              </TableCell>
                              <TableCell
                                className="max-w-55 truncate text-xs text-muted-foreground/65"
                                title={event.message || event.classification}
                              >
                                {event.message || event.classification || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    )}
                  </Table>
                </div>

                {/* Load more — inside table card */}
                {!isLoading && !isError && incidentEvents.length > 0 && (
                  <div className="flex justify-center border-t border-dark-border/25 px-5 py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 cursor-pointer px-5 text-xs"
                      disabled={!hasMoreEvents || isLoadingMoreEvents}
                      onClick={() => { void incidentEventsQuery.fetchNextPage(); }}
                    >
                      <Spinner isLoading={isLoadingMoreEvents} label="Loading...">
                        {hasMoreEvents ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MdKeyboardArrowDown className="size-4" />
                            Load More Events
                          </span>
                        ) : (
                          "All Events Loaded"
                        )}
                      </Spinner>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-60 items-center justify-center">
              <Empty
                label="Incident unavailable"
                description="This incident no longer exists or could not be found."
              />
            </div>
          )}
        </div>

        {/* ── PINNED FOOTER ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-dark-border/30 px-7 py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Status action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {showStatusActions && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer gap-1.5 px-4 text-xs"
                  disabled={ackIncidentMutation.isPending}
                  onClick={() => {
                    if (denyViewerAction()) {
                      return;
                    }
                    ackIncidentMutation.mutate(incidentDetails!.incident_key);
                  }}
                >
                  <FiShield className="size-3" />
                  Acknowledge
                </Button>
              )}
              {showStatusActions && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer px-4 text-xs"
                  disabled={closeIncidentMutation.isPending}
                  onClick={() => {
                    if (denyViewerAction()) {
                      return;
                    }
                    closeIncidentMutation.mutate(incidentDetails!.incident_key);
                  }}
                >
                  Close Incident
                </Button>
              )}
              {incidentDetails?.status === "closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 cursor-pointer px-4 text-xs"
                  disabled={reopenIncidentMutation.isPending}
                  onClick={() => {
                    if (denyViewerAction()) {
                      return;
                    }
                    reopenIncidentMutation.mutate(incidentDetails.incident_key);
                  }}
                >
                  Reopen
                </Button>
              )}
            </div>

            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 cursor-pointer px-4 text-xs text-muted-foreground hover:text-slate-200"
              >
                Dismiss
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

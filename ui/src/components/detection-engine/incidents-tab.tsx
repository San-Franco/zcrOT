import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import CommonFilter from "@/components/shared/common-filter";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import Spinner from "@/components/shared/spinner";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateTimeInBangkok,
  formatNumberShort,
  getApiErrorMessage,
} from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { LuFolderOpen } from "react-icons/lu";
import { MdDoneAll } from "react-icons/md";
import { RxCountdownTimer } from "react-icons/rx";
import { VscEye } from "react-icons/vsc";
import { useSearchParams } from "react-router";
import IncidentEventsModal from "./incident-events-modal";

type IncidentsQueryState = {
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  fetchNextPage: () => Promise<unknown>;
};

type IncidentMutationState = {
  isPending: boolean;
  mutate: (incidentKey: string) => void;
};

interface IncidentsTabProps {
  incidents: DetectionIncidentApiRow[];
  incidentsQuery: IncidentsQueryState;
  incidentStatusFilter: string;
  setIncidentStatusFilter: (value: string) => void;
  hasIncidentsNextPage: boolean;
  isIncidentsFetchingNextPage: boolean;
  ackIncidentMutation: IncidentMutationState;
  closeIncidentMutation: IncidentMutationState;
  reopenIncidentMutation: IncidentMutationState;
  isRefreshing?: boolean;
  isViewer?: boolean;
  onViewerActionDenied?: () => void;
}

const INCIDENT_STATUS_FILTERS: Filter[] = [
  { name: "All Status", value: "all" },
  { name: "Open", value: "open" },
  { name: "Ack", value: "ack" },
  { name: "Closed", value: "closed" },
];

function normalizeIncidentStatus(value?: string | null): string {
  const normalized = (value || "all").trim().toLowerCase();
  if (normalized === "open" || normalized === "ack" || normalized === "closed") {
    return normalized;
  }
  return "all";
}

export default function IncidentsTab({
  incidents,
  incidentsQuery,
  incidentStatusFilter,
  setIncidentStatusFilter,
  hasIncidentsNextPage,
  isIncidentsFetchingNextPage,
  ackIncidentMutation,
  closeIncidentMutation,
  reopenIncidentMutation,
  isRefreshing = false,
  isViewer = false,
  onViewerActionDenied,
}: IncidentsTabProps) {
  const [searchParams] = useSearchParams();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const urlIncidentStatus = searchParams.get("incidentStatus");

  useEffect(() => {
    const normalized = normalizeIncidentStatus(urlIncidentStatus);
    if (normalized !== incidentStatusFilter) {
      setIncidentStatusFilter(normalized);
    }
  }, [urlIncidentStatus, incidentStatusFilter, setIncidentStatusFilter]);

  const incidentRows = useMemo(
    () => [...incidents].sort((a, b) => +new Date(b.last_seen) - +new Date(a.last_seen)),
    [incidents],
  );

  const selectedIncident = useMemo(
    () => incidentRows.find((incident) => incident.id === selectedIncidentId) ?? null,
    [incidentRows, selectedIncidentId],
  );

  const incidentSummary = useMemo(() => {
    const summary = {
      total: incidentRows.length,
      open: 0,
      ack: 0,
      closed: 0,
    };

    for (const incident of incidentRows) {
      if (incident.status === "open") {
        summary.open += 1;
      } else if (incident.status === "ack") {
        summary.ack += 1;
      } else if (incident.status === "closed") {
        summary.closed += 1;
      }
    }

    return summary;
  }, [incidentRows]);

  const isMutating =
    ackIncidentMutation.isPending
    || closeIncidentMutation.isPending
    || reopenIncidentMutation.isPending;

  const isIncidentsLoading = incidentsQuery.isLoading || isRefreshing;

  const isIncidentsBusy =
    isIncidentsLoading
    || isMutating
    || isIncidentsFetchingNextPage;

  const incidentsErrorMessage = getApiErrorMessage(
    incidentsQuery.error,
    "Unable to load detection incidents right now.",
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                <RxCountdownTimer className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
                {isIncidentsLoading ? (
                  <Skeleton className="mt-1 h-7 w-24 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(incidentSummary.total)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-linear-to-br from-yellow-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-300">
                <LuFolderOpen className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                {isIncidentsLoading ? (
                  <Skeleton className="mt-1 h-7 w-20 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(incidentSummary.open)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-linear-to-br from-sky-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                <MdDoneAll className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ack</p>
                {isIncidentsLoading ? (
                  <Skeleton className="mt-1 h-7 w-20 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(incidentSummary.ack)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-linear-to-br from-green-500/10 via-dark-surface to-dark-bg">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/15 text-green-300">
                <MdDoneAll className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Closed</p>
                {isIncidentsLoading ? (
                  <Skeleton className="mt-1 h-7 w-20 bg-white/10" />
                ) : (
                  <p className="text-2xl font-semibold">{formatNumberShort(incidentSummary.closed)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardCardShell
        title="Threat Incidents"
        description="Correlated threat clusters from actionable detection matches."
        headerRight={(
          <div className="w-full sm:w-55">
            <CommonFilter
              isDisabled={isIncidentsBusy}
              filterValue="incidentStatus"
              filters={INCIDENT_STATUS_FILTERS}
              addFirst={false}
              defaultShow={normalizeIncidentStatus(incidentStatusFilter)}
              otherClasses="min-h-[44px] w-full"
            />
          </div>
        )}
        contentClassName="space-y-3"
      >
        {isIncidentsLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Last Seen</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableSkeleton cols={7} rows={8} />
          </Table>
        ) : incidentsQuery.isError ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Last Seen</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="Unable to load incidents"
                  description={incidentsErrorMessage}
                  classesName="h-[140px] w-[180px]"
                  lottie="fail"
                />
              </div>
            </TableCaption>
          </Table>
        ) : incidentRows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Last Seen</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption className="mt-0 p-0">
              <div className="flex min-h-80 w-full flex-col items-center justify-center py-10 text-center">
                <Empty
                  label="No incidents found"
                  description="No incidents match the current status filter."
                  classesName="h-[140px] w-[180px]"
                />
              </div>
            </TableCaption>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Last Seen</TableHead>
                  <TableHead>Incident</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Matches</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidentRows.map((incident) => (
                  <TableRow key={incident.incident_key}>
                    <TableCell className="py-6 pl-6 font-mono text-xs text-muted-foreground">
                      {formatDateTimeInBangkok(incident.last_seen)}
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="max-w-120 space-y-1">
                        <p className="truncate font-medium text-foreground">{incident.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{incident.incident_key}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="status" value={incident.status} />
                    </TableCell>
                    <TableCell>
                      <CustomBadge kind="severity" value={incident.severity} />
                    </TableCell>
                    <TableCell>{formatNumberShort(incident.match_count)}</TableCell>
                    <TableCell>{incident.max_risk_score.toFixed(1)}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() => setSelectedIncidentId(incident.id)}
                        >
                          <VscEye className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-2 flex justify-center">
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={!hasIncidentsNextPage || isIncidentsFetchingNextPage}
                onClick={() => {
                  void incidentsQuery.fetchNextPage();
                }}
              >
                <Spinner isLoading={isIncidentsFetchingNextPage} label="Loading...">
                  {hasIncidentsNextPage ? "Load More Incidents" : "No More Incidents"}
                </Spinner>
              </Button>
            </div>
          </>
        )}
      </DashboardCardShell>

      <IncidentEventsModal
        incident={selectedIncident}
        open={selectedIncident !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIncidentId(null);
          }
        }}
        ackIncidentMutation={ackIncidentMutation}
        closeIncidentMutation={closeIncidentMutation}
        reopenIncidentMutation={reopenIncidentMutation}
        isViewer={isViewer}
        onViewerActionDenied={onViewerActionDenied}
      />
    </div>
  );
}

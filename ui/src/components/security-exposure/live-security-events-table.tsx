import SecurityCardShell from "@/components/security-exposure/security-card-shell";
import DashboardEventDetailDrawer from "@/components/security-exposure/security-event-detail-drawer";
import ColumnToggle from "@/components/shared/column-toggle";
import CommonFilter from "@/components/shared/common-filter";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import LocalSearch from "@/components/shared/local-search";
import TableSkeleton from "@/components/shared/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cn,
  formatDashboardDatetime,
  formatOtHostLabel,
  formatRiskScore,
  isExternalSourceIp,
  LIVE_SECURITY_EVENTS_COLUMN_OPTIONS,
  LIVE_SECURITY_EVENT_ROW_LIMITS,
} from "@/lib/utils";
import useLiveSecurityVisibleColumns from "@/hooks/ot-security-exposure/use-live-security-visible-columns";
import useFiltersStore from "@/stores/filters-store";
import { useMemo, useState } from "react";
import { CiNoWaitingSign } from "react-icons/ci";
import { ImConnection, ImSpinner3 } from "react-icons/im";
import { MdKeyboardArrowDown } from "react-icons/md";
import { VscEye } from "react-icons/vsc";
import { Button } from "../ui/button";
import { BiWorld } from "react-icons/bi";
import { TbWorldSearch } from "react-icons/tb";
import { BsSpeedometer2 } from "react-icons/bs";
import { RiFileList3Line } from "react-icons/ri";

type Props = {
  events: DashboardNetworkEvent[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
};

function getRiskColorClass(riskScore: number) {
  if (riskScore >= 75) {
    return "text-red-400";
  }

  if (riskScore >= 50) {
    return "text-yellow-400";
  }

  if (riskScore >= 25) {
    return "text-blue-400";
  }

  return "text-emerald-400";
}

function getBooleanFlagClass(value: boolean, positiveTone: "amber" | "red" = "amber") {
  if (!value) {
    return "text-emerald-300";
  }

  if (positiveTone === "red") {
    return "text-red-300";
  }

  return "text-amber-300";
}

export default function DashboardLiveSecurityEventsTable({
  events,
  isLoading = false,
  isError = false,
  errorMessage = "Unable to load live security events right now.",
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onRetry,
}: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { filters } = useFiltersStore();
  const {
    visibleColumnIds,
    visibleColumnSet,
    visibleColumnCount,
    minSelectedColumns,
    selectAllFallbackColumnIds,
    setVisibleColumnIds,
  } = useLiveSecurityVisibleColumns();

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
    [events],
  );

  const selectedEvent = useMemo(
    () => sortedEvents.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId, sortedEvents],
  );

  return (
    <>
      <SecurityCardShell
        title="Live Security Events"
        description="Recent parsed events from final_events-style logs with protocol, direction, and investigation context."
        headerRight={(
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Rows:</span>
              <CommonFilter
                isDisabled={isLoading}
                filterValue="rows"
                filters={LIVE_SECURITY_EVENT_ROW_LIMITS}
                addFirst
                otherClasses="min-h-[38px] min-w-[100px]"
                containerClasses="w-fit"
              />
            </div>
            <ColumnToggle
              isDisabled={isLoading}
              title="Toggle Columns"
              columns={LIVE_SECURITY_EVENTS_COLUMN_OPTIONS}
              selectedColumnIds={visibleColumnIds}
              minSelected={minSelectedColumns}
              selectAllFallbackColumnIds={selectAllFallbackColumnIds}
              onSelectedColumnIdsChange={setVisibleColumnIds}
            />
          </div>
        )}
      >
        <div className="mb-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <LocalSearch
              Icon={BiWorld}
              isDisabled={isLoading}
              filterValue="source"
              placeholder="Search source IP or MAC..."
              inputClassName="w-full"
            />
            <LocalSearch
              Icon={BiWorld}
              isDisabled={isLoading}
              filterValue="destination"
              placeholder="Search destination IP or MAC..."
              inputClassName="w-full"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CommonFilter
              Icon={ImConnection}
              isDisabled={isLoading}
              filterValue="protocol"
              filters={filters.protocols}
              otherClasses="min-h-[44px] w-full"
            />
            <CommonFilter
              Icon={TbWorldSearch}
              isDisabled={isLoading}
              filterValue="identity"
              filters={filters.identity}
              otherClasses="min-h-[44px] w-full"
            />
            <CommonFilter
              Icon={BsSpeedometer2}
              isDisabled={isLoading}
              filterValue="severity"
              filters={filters.severity}
              otherClasses="min-h-[44px] w-full"
            />
            <CommonFilter
              Icon={RiFileList3Line}
              isDisabled={isLoading}
              filterValue="verdict"
              filters={filters.verdict}
              otherClasses="min-h-[44px] w-full"
            />
          </div>
        </div>

        <Table className="min-w-550">
          <TableHeader>
            <TableRow>
              {visibleColumnSet.has("timestamp") && (
                <TableHead className="text-base font-medium">Timestamp</TableHead>
              )}
              {visibleColumnSet.has("source") && (
                <TableHead className="text-base font-medium">Source</TableHead>
              )}
              {visibleColumnSet.has("sourceMac") && (
                <TableHead className="text-base font-medium">Source MAC</TableHead>
              )}
              {visibleColumnSet.has("destination") && (
                <TableHead className="text-base font-medium">Destination</TableHead>
              )}
              {visibleColumnSet.has("destinationMac") && (
                <TableHead className="text-base font-medium">Destination MAC</TableHead>
              )}
              {visibleColumnSet.has("protocol") && (
                <TableHead className="text-base font-medium">Protocol</TableHead>
              )}
              {visibleColumnSet.has("port") && (
                <TableHead className="text-base font-medium">Port</TableHead>
              )}
              {visibleColumnSet.has("direction") && (
                <TableHead className="text-base font-medium">Direction</TableHead>
              )}
              {visibleColumnSet.has("outsideHours") && (
                <TableHead className="text-base font-medium">Outside Hours</TableHead>
              )}
              {visibleColumnSet.has("modbusDisrupted") && (
                <TableHead className="text-base font-medium">Modbus Disrupted</TableHead>
              )}
              {visibleColumnSet.has("classification") && (
                <TableHead className="text-base font-medium">Classification</TableHead>
              )}
              {visibleColumnSet.has("identity") && (
                <TableHead className="text-base font-medium">Identity</TableHead>
              )}
              {visibleColumnSet.has("severity") && (
                <TableHead className="text-base font-medium">Severity</TableHead>
              )}
              {visibleColumnSet.has("verdict") && (
                <TableHead className="text-base font-medium">Verdict</TableHead>
              )}
              {visibleColumnSet.has("risk") && (
                <TableHead className="text-right font-medium text-base">Risk</TableHead>
              )}
              {visibleColumnSet.has("action") && (
                <TableHead className="text-right font-medium text-base">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton cols={visibleColumnCount} rows={8} />
          ) : (
            <TableBody>
              {sortedEvents.map((event) => (
                <TableRow key={event.id}>
                  {visibleColumnSet.has("timestamp") && (
                    <TableCell className="py-8">{formatDashboardDatetime(event.timestamp)}</TableCell>
                  )}
                  {visibleColumnSet.has("source") && (
                    <TableCell title={event.sourceIp}>{formatOtHostLabel(event.sourceIp)}</TableCell>
                  )}
                  {visibleColumnSet.has("sourceMac") && (
                    <TableCell className="font-mono text-xs text-green-400">{event.sourceMac || "-"}</TableCell>
                  )}
                  {visibleColumnSet.has("destination") && (
                    <TableCell title={event.destinationIp}>{formatOtHostLabel(event.destinationIp)}</TableCell>
                  )}
                  {visibleColumnSet.has("destinationMac") && (
                    <TableCell className="font-mono text-xs text-orange-500">{event.destinationMac || "-"}</TableCell>
                  )}
                  {visibleColumnSet.has("protocol") && (
                    <TableCell className="text-yellow-400">{event.protocol.toUpperCase()}</TableCell>
                  )}
                  {visibleColumnSet.has("port") && (
                    <TableCell className="text-blue-500">{event.destinationPort ?? "-"}</TableCell>
                  )}
                  {visibleColumnSet.has("direction") && (
                    <TableCell className="capitalize text-purple-400">{event.direction.replace(/_/g, " ")}</TableCell>
                  )}
                  {visibleColumnSet.has("outsideHours") && (
                    <TableCell className={cn("font-medium", getBooleanFlagClass(event.outsideBusinessHours, "amber"))}>
                      {event.outsideBusinessHours ? "Yes" : "No"}
                    </TableCell>
                  )}
                  {visibleColumnSet.has("modbusDisrupted") && (
                    <TableCell className={cn("font-medium", getBooleanFlagClass(event.modbusDisrupted, "red"))}>
                      {event.modbusDisrupted ? "Yes" : "No"}
                    </TableCell>
                  )}
                  {visibleColumnSet.has("classification") && (
                    <TableCell className="max-w-65 truncate">{event.classification}</TableCell>
                  )}
                  {visibleColumnSet.has("identity") && (
                    <TableCell>
                      <CustomBadge
                        kind="identity"
                        value={isExternalSourceIp(event.sourceIp) ? "external" : event.unknownClient ? "unknown" : "known"}
                      />
                    </TableCell>
                  )}
                  {visibleColumnSet.has("severity") && (
                    <TableCell>
                      <CustomBadge kind="severity" value={event.severity} />
                    </TableCell>
                  )}
                  {visibleColumnSet.has("verdict") && (
                    <TableCell>
                      <CustomBadge kind="verdict" value={event.verdict} />
                    </TableCell>
                  )}
                  {visibleColumnSet.has("risk") && (
                    <TableCell className={cn("text-right font-semibold", getRiskColorClass(event.riskScore))}>
                      {formatRiskScore(event.riskScore)}
                    </TableCell>
                  )}
                  {visibleColumnSet.has("action") && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <VscEye className="text-zcr-blue" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>

        {!isLoading && !isError && sortedEvents.length > 0 && (
          <div className="my-4 flex flex-col items-center justify-center">
            <Button
              onClick={() => onLoadMore?.()}
              disabled={!hasNextPage || isFetchingNextPage}
              variant={!hasNextPage ? "ghost" : "secondary"}
              className="cursor-pointer gap-2"
            >
              {isFetchingNextPage ? (
                <>
                  <ImSpinner3 className="animate-spin" />
                  Loading more...
                </>
              ) : hasNextPage ? (
                <>
                  <MdKeyboardArrowDown />
                  Load More
                </>
              ) : (
                <>
                  <CiNoWaitingSign />
                  Nothing more to load
                </>
              )}
            </Button>
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Empty lottie="fail" label="Failed to load live security events" description={errorMessage} />
            <Button className="mt-4 cursor-pointer" onClick={() => onRetry?.()} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && sortedEvents.length === 0 && (
          <div className="py-10">
            <Empty label="No security events" description="No events match the current filters." />
          </div>
        )}
      </SecurityCardShell>

      <DashboardEventDetailDrawer
        event={selectedEvent}
        open={selectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEventId(null);
          }
        }}
      />
    </>
  );
}

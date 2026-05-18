import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import ColumnToggle from "@/components/shared/column-toggle";
import CommonFilter from "@/components/shared/common-filter";
import CustomBadge from "@/components/shared/custom-badge";
import Empty from "@/components/shared/empty";
import LocalSearch from "@/components/shared/local-search";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTopCommunicationVisibleColumns from "@/hooks/ot-communication-control/use-top-communication-visible-columns";
import {
  TOP_COMMUNICATION_FLOW_ROW_LIMITS,
  TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS,
  cn,
  formatDashboardDatetime,
  formatOtHostLabel,
  formatRiskScore,
  formatNumberShort,
} from "@/lib/utils";
import useFiltersStore from "@/stores/filters-store";
import { useMemo } from "react";
import { BsSpeedometer2 } from "react-icons/bs";
import { CiNoWaitingSign } from "react-icons/ci";
import { ImConnection, ImSpinner3 } from "react-icons/im";
import { MdKeyboardArrowDown } from "react-icons/md";
import { BiWorld } from "react-icons/bi";

type Props = {
  rows: DashboardFlowTableRow[];
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

export default function DashboardTopCommunicationFlowsTable({
  rows,
  isLoading = false,
  isError = false,
  errorMessage = "Unable to load top communication flows right now.",
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  onRetry,
}: Props) {
  const { filters } = useFiltersStore();
  const {
    visibleColumnIds,
    visibleColumnSet,
    visibleColumnCount,
    minSelectedColumns,
    selectAllFallbackColumnIds,
    setVisibleColumnIds,
  } = useTopCommunicationVisibleColumns();

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.eventCount - a.eventCount || +new Date(b.lastSeen) - +new Date(a.lastSeen)),
    [rows],
  );
  const totalEvents = useMemo(
    () => sortedRows.reduce((sum, row) => sum + row.eventCount, 0),
    [sortedRows],
  );

  return (
    <DashboardCardShell
      title="Top Communication Flows"
      description="Aggregated communication-path behavior in the selected window: flow volume, risk profile, and operational disruption signals."
      headerRight={(
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Rows:</span>
            <CommonFilter
              isDisabled={isLoading}
              filterValue="flowRows"
              filters={TOP_COMMUNICATION_FLOW_ROW_LIMITS}
              addFirst
              otherClasses="min-h-[38px] min-w-[100px] flex-1 sm:flex-none"
              containerClasses="w-full sm:w-fit"
            />
          </div>
          <ColumnToggle
            isDisabled={isLoading}
            title="Toggle Columns"
            columns={TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS}
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
            filterValue="flowSource"
            placeholder="Search source IP..."
            inputClassName="w-full"
          />
          <LocalSearch
            Icon={BiWorld}
            isDisabled={isLoading}
            filterValue="flowDestination"
            placeholder="Search destination IP..."
            inputClassName="w-full"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CommonFilter
            Icon={ImConnection}
            isDisabled={isLoading}
            filterValue="flowProtocol"
            filters={filters.protocols}
            otherClasses="min-h-[44px] w-full"
          />
          <CommonFilter
            Icon={BsSpeedometer2}
            isDisabled={isLoading}
            filterValue="flowSeverity"
            filters={filters.severity}
            otherClasses="min-h-[44px] w-full"
          />
        </div>
      </div>

      <Table className="min-w-[72rem]">
        <TableHeader>
          <TableRow>
            {visibleColumnSet.has("firstSeen") && (
              <TableHead className="font-medium text-base">First Seen</TableHead>
            )}
            {visibleColumnSet.has("lastSeen") && (
              <TableHead className="font-medium text-base">Last Seen</TableHead>
            )}
            {visibleColumnSet.has("source") && (
              <TableHead className="font-medium text-base">Source</TableHead>
            )}
            {visibleColumnSet.has("destination") && (
              <TableHead className="font-medium text-base">Destination</TableHead>
            )}
            {visibleColumnSet.has("protocol") && (
              <TableHead className="font-medium text-base">Protocol</TableHead>
            )}
            {visibleColumnSet.has("port") && (
              <TableHead className="font-medium text-base">Port</TableHead>
            )}
            {visibleColumnSet.has("direction") && (
              <TableHead className="font-medium text-base">Direction</TableHead>
            )}
            {visibleColumnSet.has("severity") && (
              <TableHead className="font-medium text-base">Highest Severity</TableHead>
            )}
            {visibleColumnSet.has("avgRisk") && (
              <TableHead className="text-right text-base font-medium">Avg Risk</TableHead>
            )}
            {visibleColumnSet.has("maxRisk") && (
              <TableHead className="text-right text-base font-medium">Peak Risk</TableHead>
            )}
            {visibleColumnSet.has("events") && (
              <TableHead className="text-right text-base font-medium">Events</TableHead>
            )}
            {visibleColumnSet.has("share") && (
              <TableHead className="text-right text-base font-medium">Share</TableHead>
            )}
          </TableRow>
        </TableHeader>
        {isLoading ? (
          <TableSkeleton cols={visibleColumnCount} rows={8} />
        ) : (
          <TableBody>
            {sortedRows.map((row, index) => (
              <TableRow key={`${row.sourceIp}-${row.destinationIp}-${row.protocol}-${row.port}-${index}`}>
                {visibleColumnSet.has("firstSeen") && (
                  <TableCell className="py-6">{formatDashboardDatetime(row.firstSeen)}</TableCell>
                )}
                {visibleColumnSet.has("lastSeen") && (
                  <TableCell>{formatDashboardDatetime(row.lastSeen)}</TableCell>
                )}
                {visibleColumnSet.has("source") && (
                  <TableCell title={row.sourceIp}>{formatOtHostLabel(row.sourceIp)}</TableCell>
                )}
                {visibleColumnSet.has("destination") && (
                  <TableCell title={row.destinationIp}>{formatOtHostLabel(row.destinationIp)}</TableCell>
                )}
                {visibleColumnSet.has("protocol") && (
                  <TableCell className="text-yellow-400">{row.protocol}</TableCell>
                )}
                {visibleColumnSet.has("port") && (
                  <TableCell className="text-blue-500">{row.port}</TableCell>
                )}
                {visibleColumnSet.has("direction") && (
                  <TableCell className="capitalize text-purple-400">{row.direction.replace(/_/g, " ")}</TableCell>
                )}
                {visibleColumnSet.has("severity") && (
                  <TableCell>
                    <CustomBadge kind="severity" value={row.highestSeverity} />
                  </TableCell>
                )}
                {visibleColumnSet.has("avgRisk") && (
                  <TableCell className={cn("text-right font-semibold", getRiskColorClass(row.avgRiskScore))}>
                    {formatRiskScore(row.avgRiskScore)}
                  </TableCell>
                )}
                {visibleColumnSet.has("maxRisk") && (
                  <TableCell className={cn("text-right font-semibold", getRiskColorClass(row.maxRiskScore))}>
                    {formatRiskScore(row.maxRiskScore)}
                  </TableCell>
                )}
                {visibleColumnSet.has("events") && (
                  <TableCell className="text-right font-semibold">{formatNumberShort(row.eventCount)}</TableCell>
                )}
                {visibleColumnSet.has("share") && (
                  <TableCell className="text-right">
                    {totalEvents ? `${((row.eventCount / totalEvents) * 100).toFixed(1)}%` : "0%"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      {!isLoading && !isError && sortedRows.length > 0 && (
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
          <Empty lottie="fail" label="Failed to load top communication flows" description={errorMessage} />
          <Button className="mt-4 cursor-pointer" onClick={() => onRetry?.()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && sortedRows.length === 0 && (
        <div className="py-10">
          <Empty label="No flow data" description="No communication flows match the current filters." />
        </div>
      )}
    </DashboardCardShell>
  );
}

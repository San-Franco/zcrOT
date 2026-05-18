import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import { formatDecimal, resolveOtDeviceNameByUnitId } from "@/lib/utils";
import Empty from "@/components/shared/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomBadge from "../shared/custom-badge";

type Props = {
  rows: DashboardModbusUnitHealthRow[];
  isError?: boolean;
  errorMessage?: string | null;
};

function getModbusUnitHealth(row: DashboardModbusUnitHealthRow): "Healthy" | "Watch" | "Degraded" {
  if (row.errorCount > 0) {
    return "Degraded";
  }

  if (row.totalRequests === 0 || row.slowCount > 0 || row.responseTimeMaxMs > 80) {
    return "Watch";
  }

  return "Healthy";
}

export default function DashboardModbusUnitHealthTable({
  rows,
  isError = false,
  errorMessage = null,
}: Props) {
  const hasRows = rows.length > 0;

  return (
    <DashboardCardShell
      title="Modbus Unit Health"
      description="Per-unit polling reliability for authorized Power control-path behavior."
    >
      <Table className="min-w-[58rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-medium">Unit</TableHead>
            <TableHead className="text-right text-base font-medium">Requests</TableHead>
            <TableHead className="text-right text-base font-medium">Success</TableHead>
            <TableHead className="text-right text-base font-medium">Errors</TableHead>
            <TableHead className="text-right text-base font-medium">Slow</TableHead>
            <TableHead className="text-right text-base font-medium">Success %</TableHead>
            <TableHead className="text-right text-base font-medium">Avg ms</TableHead>
            <TableHead className="text-right text-base font-medium">Max ms</TableHead>
            <TableHead className="text-right font-medium text-base">Health</TableHead>
          </TableRow>
        </TableHeader>
        {hasRows && !isError && (
          <TableBody>
            {rows.map((row) => {
              const successRate = row.totalRequests ? (row.successCount / row.totalRequests) * 100 : 0;
              const health = getModbusUnitHealth(row);
              const unitMappingName = resolveOtDeviceNameByUnitId(row.unitId);

              return (
                <TableRow key={row.unitId}>
                  <TableCell className="py-6 font-semibold">
                    <div className="flex flex-col">
                      <span>{unitMappingName || `Unit ${row.unitId}`}</span>
                      {unitMappingName && <span className="text-xs font-mono text-muted-foreground">Unit {row.unitId}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{row.totalRequests}</TableCell>
                  <TableCell className="text-right text-emerald-500">{row.successCount}</TableCell>
                  <TableCell className="text-right text-red-500">{row.errorCount}</TableCell>
                  <TableCell className="text-right text-blue-500">{row.slowCount}</TableCell>
                  <TableCell className="text-right">{formatDecimal(successRate, 1)}</TableCell>
                  <TableCell className="text-right">{formatDecimal(row.responseTimeAvgMs, 2)}</TableCell>
                  <TableCell className="text-right">{formatDecimal(row.responseTimeMaxMs, 2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <CustomBadge value={health} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        )}
      </Table>

      {isError ? (
        <div className="flex h-75 items-center justify-center">
          <Empty
            lottie="fail"
            label="Failed to load Modbus unit health"
            description={errorMessage ?? "Unable to load Modbus unit health data right now."}
          />
        </div>
      ) : !hasRows ? (
        <div className="py-10">
          <Empty label="No unit health rows" description="No Modbus summaries match the current filters." />
        </div>
      ) : null}
    </DashboardCardShell>
  );
}

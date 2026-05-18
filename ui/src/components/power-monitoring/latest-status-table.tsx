import PowerDeviceDetailsModal from "@/components/modals/device-details-modal";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import {
  formatPowerDeviceTypeLabel,
  formatDateTimeInBangkok,
  formatLatestMeasurement,
  getFreshnessClass
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { VscEye } from "react-icons/vsc";
import CustomBadge from "../shared/custom-badge";
import Empty from "../shared/empty";

export default function PowerLatestStatusTable({
  data,
}: {
  data: PowerLatestStatusRow[];
}) {
  const [selectedRow, setSelectedRow] = useState<PowerLatestStatusRow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (row: PowerLatestStatusRow) => {
    setSelectedRow(row);
    setIsDetailsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsDetailsOpen(open);

    if (!open) {
      setSelectedRow(null);
    }
  };

  return (
    <PowerCardShell
      title="Latest Device Status"
      description="Latest timestamp, freshness, health, and current reading for each monitored device."
      className="flex h-full flex-col"
      contentClassName="flex min-h-0 flex-1"
    >
      {data.length ? (
        <div className="custom-scrollbar h-full w-full overflow-auto pr-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Type / Unit</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Latest Measurement</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={`${row.deviceName}-${row.unitId}`}>
                  <TableCell className="py-5">
                    <div className="space-y-1">
                      <p className="font-medium">{row.deviceName}</p>
                      <p className="text-xs text-muted-foreground">{row.site}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPowerDeviceTypeLabel(row.deviceType)} / {row.unitId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatDateTimeInBangkok(row.lastSeen)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getFreshnessClass(row.freshnessMinutes)}>
                      {row.freshnessMinutes < 1 ? "<1 min" : `${row.freshnessMinutes.toFixed(1)} min`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CustomBadge value={row.health} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatLatestMeasurement(row)}</TableCell>
                  <TableCell className="max-w-72 truncate text-muted-foreground">{row.summary}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => handleOpenDetails(row)}
                    >
                      <VscEye className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Empty
              label="No latest device status found."
              description="Try another time range or refresh after new telemetry arrives."
            />
          </div>
        </div>
      )}
      <PowerDeviceDetailsModal row={selectedRow} open={isDetailsOpen} onOpenChange={handleOpenChange} />
    </PowerCardShell>
  );
}

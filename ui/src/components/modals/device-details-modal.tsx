import {
  formatCompactNumber,
  formatDateTimeInBangkok,
  formatDecimal,
  formatLatestMeasurement,
  formatPowerDeviceTypeLabel,
  getFreshnessClass,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Activity, Clock3, Gauge, MapPin, SunMedium, Thermometer, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import CustomBadge from "../shared/custom-badge";

type TelemetryItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function buildTelemetryItems(row: PowerLatestStatusRow): TelemetryItem[] {
  const items: Array<TelemetryItem | null> = [
    typeof row.activePower === "number"
      ? {
        label: "Active Power",
        value: `${formatDecimal(row.activePower)} kW`,
        icon: Activity,
      }
      : null,
    typeof row.dailyEnergy === "number"
      ? {
        label: "Daily Energy",
        value: `${formatDecimal(row.dailyEnergy)} kWh`,
        icon: Gauge,
      }
      : null,
    typeof row.meterVoltage === "number"
      ? {
        label: "Meter Voltage",
        value: `${formatDecimal(row.meterVoltage)} V`,
        icon: Gauge,
      }
      : null,
    typeof row.meterActivePower === "number"
      ? {
        label: "Meter Active Power",
        value: `${formatDecimal(row.meterActivePower)} kW`,
        icon: Activity,
      }
      : null,
    typeof row.irradianceSecondary === "number"
      ? {
        label: "Secondary Irradiance",
        value: formatCompactNumber(row.irradianceSecondary, 0),
        icon: SunMedium,
      }
      : null,
    typeof row.moduleTemperature === "number"
      ? {
        label: "Module Temperature",
        value: `${formatDecimal(row.moduleTemperature)} C`,
        icon: Thermometer,
      }
      : null,
  ];

  return items.filter((item): item is TelemetryItem => item !== null);
}

function OverviewCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-dark-bg/35 p-4 shadow-[0_10px_30px_rgba(2,8,20,0.18)]">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
        <Icon className="size-3.5 text-sky-300" />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

export default function PowerDeviceDetailsModal({
  row,
  open,
  onOpenChange,
}: {
  row: PowerLatestStatusRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) {
    return null;
  }

  const telemetryItems = buildTelemetryItems(row);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="no-scrollbar max-h-[92vh] overflow-y-auto border-dark-border/50 modal-bg sm:max-w-4xl">
        <DialogHeader className="border-b border-dark-border/40 pb-5 text-left">
          <div className="space-y-3">
            <div className="space-y-1.5 pr-8">
              <DialogTitle className="text-[1.85rem] leading-tight text-white">{row.deviceName}</DialogTitle>
              <DialogDescription className="max-w-2xl text-sm text-slate-400">
                Latest telemetry snapshot and health status for the selected device.
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                <span>{formatPowerDeviceTypeLabel(row.deviceType)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>Unit {row.unitId}</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span>{row.site}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CustomBadge value={row.health} />
                <Badge variant="outline" className={getFreshnessClass(row.freshnessMinutes)}>
                  {row.freshnessMinutes < 1 ? "<1 min old" : `${row.freshnessMinutes.toFixed(1)} min old`}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-sky-400/15 bg-linear-to-br from-sky-500/10 via-white/3 to-transparent p-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-sky-300 uppercase">Operational Summary</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{row.summary}</p>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-white">Device Snapshot</h3>
              <p className="text-sm text-slate-400">Core identity and timing fields for the selected row.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <OverviewCard label="Site" value={row.site} icon={MapPin} />
              <OverviewCard label="Last Seen" value={formatDateTimeInBangkok(row.lastSeen)} icon={Clock3} />
              <OverviewCard label="Latest Measurement" value={formatLatestMeasurement(row)} icon={Activity} />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-white">Telemetry Details</h3>
              <p className="text-sm text-slate-400">
                Available measurement fields captured in the current latest-status payload.
              </p>
            </div>

            {telemetryItems.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {telemetryItems.map((item) => (
                  <OverviewCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/8 bg-dark-bg/35 p-4 text-sm text-slate-300">
                No additional structured telemetry fields are present for this row yet.
              </div>
            )}
          </section>
        </div>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button className="cursor-pointer min-h-11" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}

import { Fragment } from "react";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import { formatPowerDeviceTypeLabel, getHeatColor } from "@/lib/utils";
import Empty from "../shared/empty";

const typeOrder: Array<keyof Omit<PowerReportingCadenceRow, "window">> = [
  "smartlogger3000",
  "inverter",
  "power_meter",
  "emi",
];

export default function PowerReportingCadenceCard({
  data,
}: {
  data: PowerReportingCadenceRow[];
}) {
  const maxValue = data.reduce((max, row) => {
    return Math.max(max, row.smartlogger3000, row.inverter, row.power_meter, row.emi);
  }, 0);

  return (
    <PowerCardShell
      title="Reporting Cadence Heatmap"
      description="A simple heartbeat view showing that Power telemetry is strong for timing consistency and stale-device monitoring."
      className="flex h-full flex-col"
      contentClassName="space-y-4"
    >
      {data.length ? (
        <>
          <div
            className="grid gap-2 text-xs"
            style={{ gridTemplateColumns: `110px repeat(${data.length}, minmax(0, 1fr))` }}
          >
            <div />
            {data.map((row) => (
              <div key={row.window} className="text-center text-muted-foreground">
                {row.window}
              </div>
            ))}

            {typeOrder.map((deviceType) => (
              <Fragment key={deviceType}>
                <div className="flex items-center font-medium text-muted-foreground">
                  {formatPowerDeviceTypeLabel(deviceType)}
                </div>
                {data.map((row) => {
                  const value = row[deviceType];
                  const deviceTypeLabel = formatPowerDeviceTypeLabel(deviceType);
                  return (
                    <div
                      key={`${deviceType}-${row.window}`}
                      className="flex h-13 md:h-14 items-center justify-center rounded-md border border-dark-border/40 text-[11px] font-semibold text-slate-100"
                      style={{ backgroundColor: getHeatColor(value, maxValue) }}
                      title={`${deviceTypeLabel} at ${row.window}: ${value} samples`}
                    >
                      {value}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            This heartbeat view now reflects real sample density by device type across the selected window.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-18 w-full">
          <Empty
            label="No reporting cadence data found."
            description="Try another time range or refresh after new telemetry arrives."
          />
        </div>
      )}
    </PowerCardShell>
  );
}

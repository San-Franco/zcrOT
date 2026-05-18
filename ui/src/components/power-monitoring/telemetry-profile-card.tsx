import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import { formatNumberShort, formatPowerDeviceTypeLabel } from "@/lib/utils";
import Empty from "../shared/empty";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

const chartConfig = {
  signalCount: {
    label: "Available telemetry fields",
    color: "#38bdf8",
  },
} satisfies ChartConfig;

export default function PowerTelemetryProfileCard({
  data,
}: {
  data: PowerTelemetryProfileItem[];
}) {
  return (
    <PowerCardShell
      title="Signal Richness By Device Type"
      description="This reflects what each current device type can contribute to the dashboard with the existing Power log format."
      className="flex h-full flex-col"
      contentClassName="flex min-h-0 flex-1 flex-col gap-4"
    >
      {data.length ? (
        <div className="flex w-full flex-col items-stretch gap-4 xl:flex-row">
          <div className="h-56 w-full xl:h-auto xl:min-h-60 xl:flex-[1.15]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={data} margin={{ top: 8, right: 10, left: 2, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="deviceType"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatPowerDeviceTypeLabel(String(value))}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(value) => formatNumberShort(Number(value))}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="signalCount" radius={[6, 6, 0, 0]}>
                  {data.map((item) => (
                    <Cell key={item.deviceType} fill={item.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          <div className="grid w-full grid-cols-1 content-start auto-rows-max gap-2 xl:flex-1">
            {data.map((item) => (
              <div key={item.deviceType} className="w-full rounded-lg border border-white/6 bg-white/3 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <p className="font-medium">{formatPowerDeviceTypeLabel(item.deviceType)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatNumberShort(item.deviceCount)} device{item.deviceCount === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {item.visibilityLabel}
                  {" "}
                  •
                  {" "}
                  {item.reportingIntervalSeconds}
                  s cadence •
                  {" "}
                  {formatNumberShort(item.signalCount)}
                  {" "}
                  telemetry fields
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-18 w-full">
          <Empty
            label="No signal richness data found."
            description="Try another time range or refresh after new readings arrive."
          />
        </div>
      )}
    </PowerCardShell>
  );
}

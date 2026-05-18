import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import { Pie, PieChart, Cell } from "recharts";
import Empty from "../shared/empty";

const chartConfig = {
  reportingNormally: {
    label: "Reporting normally",
    color: "#22c55e",
  },
  limitedTelemetry: {
    label: "Limited telemetry",
    color: "#f59e0b",
  },
  staleOrMissing: {
    label: "Stale or missing",
    color: "#ef4444",
  },
} satisfies ChartConfig;

export default function PowerTelemetryCoverageCard({
  data,
}: {
  data: PowerTelemetryCoverageItem[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <PowerCardShell
      title="Telemetry Coverage"
      description="Reporting status across visible devices."
      className="flex h-full flex-col"
      contentClassName="flex min-h-0 flex-1"
    >
      {total ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto!">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="coverageKey" />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="coverageKey"
                outerRadius={88}
                strokeWidth={0}
              >
                {data.map((item) => (
                  <Cell key={item.coverageKey} fill={item.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey="coverageKey"
                    className="flex-wrap gap-x-3 gap-y-1.5 pt-2 mt-6 text-[11px] text-slate-300 [&>div]:basis-[48%] [&>div]:justify-center sm:[&>div]:basis-auto"
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Empty
              label="No telemetry coverage data found."
              description="Try another time range or refresh after new telemetry arrives."
            />
          </div>
        </div>
      )}
    </PowerCardShell>
  );
}

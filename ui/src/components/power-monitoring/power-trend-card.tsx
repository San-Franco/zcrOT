import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import Empty from "../shared/empty";

const chartConfig = {
  smartloggerAggregate: {
    label: "Aggregate",
    color: "#38bdf8",
  },
  inverterOutput: {
    label: "Inverter output",
    color: "#22c55e",
  },
  meterActivePower: {
    label: "Meter active power",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

export default function PowerTrendCard({ data }: { data: PowerTrendPoint[] }) {
  return (
    <PowerCardShell
      title="Power Trend"
      description="Aggregate, inverter, and meter power across the selected range."
      className="flex flex-col"
      contentClassName="flex min-h-0 flex-1"
    >
      {data.length ? (
        <ChartContainer config={chartConfig} className="h-80 w-full aspect-auto! md:h-85">
          <LineChart data={data} margin={{ top: 10, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              tickMargin={12}
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 5)}
            />
            <YAxis tickMargin={12} tickLine={false} axisLine={false} allowDecimals />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="natural"
              dataKey="smartloggerAggregate"
              stroke="var(--color-smartloggerAggregate)"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="natural"
              dataKey="inverterOutput"
              stroke="var(--color-inverterOutput)"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="natural"
              dataKey="meterActivePower"
              stroke="var(--color-meterActivePower)"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-18 w-full">
          <Empty
            label="No power trend data found."
            description="Try another time range or refresh after new readings arrive."
          />
        </div>
      )}
    </PowerCardShell>
  );
}

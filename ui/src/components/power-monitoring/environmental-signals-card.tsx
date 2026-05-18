import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PowerCardShell from "@/components/power-monitoring/power-card-shell";
import Empty from "../shared/empty";
import { Area, ComposedChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  irradianceSecondary: {
    label: "Secondary irradiance",
    color: "#f59e0b",
  },
  moduleTemperature: {
    label: "Module temperature",
    color: "#ef4444",
  },
  activePower: {
    label: "Active power",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export default function PowerEnvironmentalSignalsCard({
  data,
}: {
  data: PowerEnvironmentalPoint[];
}) {
  return (
    <PowerCardShell
      title="Environmental Signals"
      description="Irradiance, module temperature, and active power for the selected range."
      className="flex flex-col"
      contentClassName="flex min-h-0 flex-1"
    >
      {data.length ? (
        <ChartContainer config={chartConfig} className="h-85 w-full aspect-auto! md:h-90">
          <ComposedChart data={data} margin={{ top: 10, right: 28, left: 16, bottom: 8 }}>
            <defs>
              <linearGradient id="irradianceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-irradianceSecondary)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-irradianceSecondary)" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              tickMargin={12}
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 5)}
            />
            <YAxis
              tickMargin={12}
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              label={{ value: "Irradiance", angle: -90, position: "insideLeft", offset: -4 }}
            />
            <YAxis
              tickMargin={12}
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              label={{ value: "Temp / Power", angle: 90, position: "insideRight", offset: -2 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="irradianceSecondary"
              stroke="var(--color-irradianceSecondary)"
              fill="url(#irradianceFill)"
              fillOpacity={1}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="moduleTemperature"
              stroke="var(--color-moduleTemperature)"
              strokeWidth={2.2}
              dot={{ r: 3 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activePower"
              stroke="var(--color-activePower)"
              strokeWidth={2.4}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-18 w-full">
          <Empty
            label="No environmental signals found."
            description="Try another time range or refresh after new EMI samples arrive."
          />
        </div>
      )}
    </PowerCardShell>
  );
}

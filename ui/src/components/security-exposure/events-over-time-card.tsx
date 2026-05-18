import SecurityCardShell from "@/components/security-exposure/security-card-shell";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import Empty from "@/components/shared/empty";
import { formatNumberShort } from "@/lib/utils";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  low: {
    label: "Low",
    color: "#22c55e",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
  },
  high: {
    label: "High",
    color: "#f97316",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
  },
} satisfies ChartConfig;

type Props = {
  data: DashboardSeverityTrendRow[];
  isError?: boolean;
  errorMessage?: string;
};

export default function DashboardEventsOverTimeCard({
  data,
  isError = false,
  errorMessage = "Unable to load events over time data right now.",
}: Props) {
  return (
    <SecurityCardShell
      title="Events Over Time"
      description="Stacked area trend by severity to track short-term threat pressure."
      contentClassName="h-[350px]"
    >
      {isError ? (
        <div className="flex h-full items-center justify-center">
          <Empty lottie="fail" label="Failed to load events over time" description={errorMessage} />
        </div>
      ) : data.length ? (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 6 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tickFormatter={(value) => formatNumberShort(Number(value))}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="low"
              stackId="severity"
              stroke="var(--color-low)"
              fill="var(--color-low)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="severity"
              stroke="var(--color-medium)"
              fill="var(--color-medium)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="severity"
              stroke="var(--color-high)"
              fill="var(--color-high)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="severity"
              stroke="var(--color-critical)"
              fill="var(--color-critical)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty label="No severity trend data" description="Current filters returned no security events." />
        </div>
      )}
    </SecurityCardShell>
  );
}

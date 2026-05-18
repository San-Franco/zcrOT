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
import { formatNumberShort, formatOtHostLabel } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  maxRiskScore: {
    label: "Max risk",
    color: "#ef4444",
  },
  avgRiskScore: {
    label: "Avg risk",
    color: "#f59e0b",
  },
  eventCount: {
    label: "Event count",
    color: "#38bdf8",
  },
} satisfies ChartConfig;

type Props = {
  data: DashboardRiskSourceRow[];
  isError?: boolean;
  errorMessage?: string;
};

export default function DashboardTopRiskySourcesCard({
  data,
  isError = false,
  errorMessage = "Unable to load top risky sources data right now.",
}: Props) {
  return (
    <SecurityCardShell
      title="Top Risky Sources"
      description="Source IPs ranked by max/average risk and event count in the selected window."
      contentClassName="h-[350px]"
    >
      {isError ? (
        <div className="flex h-full items-center justify-center">
          <Empty lottie="fail" label="Failed to load top risky sources" description={errorMessage} />
        </div>
      ) : data.length ? (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 6 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="sourceIp"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => formatOtHostLabel(String(value))}
            />
            <YAxis yAxisId="risk" tickLine={false} axisLine={false} tickMargin={8} domain={[0, 100]} />
            <YAxis
              yAxisId="count"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tickFormatter={(value) => formatNumberShort(Number(value))}
            />
            <ChartTooltip
              content={(
                <ChartTooltipContent
                  labelFormatter={(label) => formatOtHostLabel(String(label))}
                />
              )}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="risk" dataKey="maxRiskScore" fill="var(--color-maxRiskScore)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="risk" dataKey="avgRiskScore" fill="var(--color-avgRiskScore)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="count" dataKey="eventCount" fill="var(--color-eventCount)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty label="No risky-source data" description="No source IPs match the current filters." />
        </div>
      )}
    </SecurityCardShell>
  );
}

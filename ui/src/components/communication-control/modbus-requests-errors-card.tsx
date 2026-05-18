import DashboardCardShell from "@/components/communication-control/communication-card-shell";
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
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

const chartConfig = {
  totalRequests: {
    label: "Total requests",
    color: "#38bdf8",
  },
  totalErrors: {
    label: "Total errors",
    color: "#ef4444",
  },
} satisfies ChartConfig;

type Props = {
  data: DashboardModbusRequestsErrorRow[];
  isError?: boolean;
  errorMessage?: string | null;
};

export default function DashboardModbusRequestsErrorsCard({
  data,
  isError = false,
  errorMessage = null,
}: Props) {
  return (
    <DashboardCardShell
      title="Modbus Requests vs Errors"
      description="Request volume compared with error counts to verify control reliability."
      className="h-115"
      contentClassName="h-full min-h-0 flex-1"
    >
      {isError ? (
        <div className="flex h-full items-center justify-center">
          <Empty
            lottie="fail"
            label="Failed to load Modbus requests vs errors"
            description={errorMessage ?? "Unable to load Modbus request/error data right now."}
          />
        </div>
      ) : data.length ? (
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto!">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 6 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tickFormatter={(value) => formatNumberShort(Number(value))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tickFormatter={(value) => formatNumberShort(Number(value))}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="left" dataKey="totalRequests" fill="var(--color-totalRequests)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" dataKey="totalErrors" stroke="var(--color-totalErrors)" strokeWidth={2.4} dot={{ r: 3 }} />
          </ComposedChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty label="No request/error trend data" description="Current filters returned no Modbus request records." />
        </div>
      )}
    </DashboardCardShell>
  );
}

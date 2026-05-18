import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { resolveOtDeviceNameByUnitId } from "@/lib/utils";
import Empty from "@/components/shared/empty";
import { useMemo } from "react";
import useDeviceMappingsStore from "@/stores/device-mappings-store";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type Props = {
  data: DashboardModbusLatencyRow[];
  isError?: boolean;
  errorMessage?: string | null;
};

export default function DashboardModbusResponseTimeCard({
  data,
  isError = false,
  errorMessage = null,
}: Props) {
  const deviceMappings = useDeviceMappingsStore((state) => state.mappings);
  const chartConfig = useMemo(() => ({
    unit0AvgMs: {
      label: resolveOtDeviceNameByUnitId(0) || "Unit 0",
      color: "#38bdf8",
    },
    unit1AvgMs: {
      label: resolveOtDeviceNameByUnitId(1) || "Unit 1",
      color: "#22c55e",
    },
    unit11AvgMs: {
      label: resolveOtDeviceNameByUnitId(11) || "Unit 11",
      color: "#f59e0b",
    },
    unit100AvgMs: {
      label: resolveOtDeviceNameByUnitId(100) || "Unit 100",
      color: "#a855f7",
    },
  } satisfies ChartConfig), [deviceMappings]);

  return (
    <DashboardCardShell
      title="Modbus Response Time by Unit"
      description="Average response latency trend (ms) per Power unit ID."
      className="h-115"
      contentClassName="h-full min-h-0 flex-1"
    >
      {isError ? (
        <div className="flex h-full items-center justify-center">
          <Empty
            lottie="fail"
            label="Failed to load Modbus response time"
            description={errorMessage ?? "Unable to load response time data right now."}
          />
        </div>
      ) : data.length ? (
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto!">
          <LineChart data={data} margin={{ top: 8, right: 14, left: 0, bottom: 6 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="bucket" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line type="monotone" dataKey="unit0AvgMs" stroke="var(--color-unit0AvgMs)" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="unit1AvgMs" stroke="var(--color-unit1AvgMs)" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="unit11AvgMs" stroke="var(--color-unit11AvgMs)" strokeWidth={2.2} dot={false} />
            <Line type="monotone" dataKey="unit100AvgMs" stroke="var(--color-unit100AvgMs)" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty label="No Modbus latency data" description="Current filters returned no Modbus summaries." />
        </div>
      )}
    </DashboardCardShell>
  );
}

import Empty from "@/components/shared/empty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumberShort } from "@/lib/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";

const verdictMeta = {
  LIKELY_LEGITIMATE: {
    label: "Likely legitimate",
    color: "#22c55e",
  },
  LIKELY_LEGITIMATE_UNKNOWN_IP: {
    label: "Legitimate (unknown IP)",
    color: "#14b8a6",
  },
  UNDER_INVESTIGATION: {
    label: "Under investigation",
    color: "#f59e0b",
  },
  LIKELY_ATTACK: {
    label: "Likely attack",
    color: "#ef4444",
  },
} as const;

type Props = {
  data: DashboardVerdictTrendRow[];
  isError?: boolean;
  errorMessage?: string;
};

export default function DashboardVerdictTrendCard({
  data,
  isError = false,
  errorMessage = "Unable to load verdict distribution data right now.",
}: Props) {
  const chartData = useMemo(() => {
    const totals = {
      LIKELY_LEGITIMATE: 0,
      LIKELY_LEGITIMATE_UNKNOWN_IP: 0,
      UNDER_INVESTIGATION: 0,
      LIKELY_ATTACK: 0,
    };

    data.forEach((row) => {
      totals.LIKELY_LEGITIMATE += row.LIKELY_LEGITIMATE;
      totals.LIKELY_LEGITIMATE_UNKNOWN_IP += row.LIKELY_LEGITIMATE_UNKNOWN_IP;
      totals.UNDER_INVESTIGATION += row.UNDER_INVESTIGATION;
      totals.LIKELY_ATTACK += row.LIKELY_ATTACK;
    });

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return {
      totalCount: total,
      slices: (Object.entries(totals) as Array<[keyof typeof totals, number]>)
        .map(([key, value]) => ({
          key,
          value,
          fill: verdictMeta[key].color,
        }))
        .filter((item) => item.value > 0),
    };
  }, [data]);

  const chartConfig = useMemo(
    () =>
      chartData.slices.reduce((config, item) => {
        config[item.key] = {
          label: verdictMeta[item.key].label,
          color: item.fill,
        };
        return config;
      }, {} as ChartConfig),
    [chartData.slices],
  );

  const hasData = chartData.slices.length > 0;

  return (
    <Card className="relative min-h-90 overflow-hidden border-dark-border/30 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 animate-pulse-slow" />
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <CardHeader className="relative z-10 pb-1">
        <CardTitle className="text-lg">Verdict Distribution</CardTitle>
        <CardDescription>Verdict share in selected window.</CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 flex h-full flex-col items-center justify-center space-y-4 pb-4 pt-2">
        {isError ? (
          <div className="flex h-full w-full items-center justify-center py-8">
            <Empty lottie="fail" label="Failed to load verdict distribution" description={errorMessage} />
          </div>
        ) : !hasData ? (
          <div className="flex h-full w-full items-center justify-center py-8">
            <Empty label="No verdict distribution data" description="Try widening the time range to view verdict mix." />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-70 w-full max-h-75">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="key"
                    className="bg-dark-surface border-dark-border"
                    labelClassName="text-dark-text"
                  />
                }
              />
              <Pie
                data={chartData.slices}
                dataKey="value"
                nameKey="key"
                innerRadius={62}
                outerRadius={94}
                strokeWidth={0}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                      return null;
                    }

                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-100 text-[34px] font-semibold">
                          {formatNumberShort(chartData.totalCount)}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 21} className="fill-slate-400 text-xs font-medium">
                          Total Events
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <ChartLegend
                content={
                  <ChartLegendContent
                    nameKey="key"
                    className="flex-wrap gap-x-3 gap-y-1.5 pt-2 mt-6 text-[11px] text-slate-300 [&>div]:basis-[48%] [&>div]:justify-center sm:[&>div]:basis-auto"
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { dashboardKpiToneClasses, formatMetricValue } from "@/lib/utils";
import type { CSSProperties } from "react";

type Props = {
  cards: DashboardKpiCard[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
};

export default function SecurityKpiCards({
  cards,
  isLoading = false,
  isError = false,
  errorMessage = null,
}: Props) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(var(--kpi-card-count),minmax(0,1fr))] 2xl:gap-4"
      style={{ "--kpi-card-count": Math.max(cards.length, 1) } as CSSProperties}
    >
      {cards.map((card) => {
        const tone = dashboardKpiToneClasses[card.tone];
        const metricValue = isError ? "N/A" : formatMetricValue(card.value);
        const trendLabel = isError ? "Data unavailable" : card.trendLabel;
        const helperText = isError ? (errorMessage ?? "Unable to load KPI data right now.") : card.helper;

        return (
          <Card key={card.id} className="relative min-w-0 overflow-hidden border-white/8 bg-[#101a2d] shadow-[0_10px_28px_rgba(3,8,20,0.18)]">
            <div className={cn("pointer-events-none absolute inset-0 bg-linear-to-br opacity-45", tone.ring)} />
            <CardHeader className="relative z-10">
              <CardTitle className="line-clamp-2 text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-2">
              {isLoading ? (
                <Skeleton className="h-8 w-28 bg-white/10 md:h-8" />
              ) : (
                <div className="truncate text-2xl font-semibold leading-none tracking-tight text-foreground md:text-[1.75rem] xl:text-[2rem]">{metricValue}</div>
              )}
              <div className="space-y-1.5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-24 bg-white/8" />
                    <Skeleton className="h-3 w-40 bg-white/6" />
                  </>
                ) : (
                  <>
                    <div className={cn("line-clamp-1 text-sm font-semibold capitalize", tone.delta)}>{trendLabel}</div>
                    <p className="line-clamp-2 text-xs text-slate-400">{helperText}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDashboardDatetime, formatNumberShort } from "@/lib/utils";
import Empty from "@/components/shared/empty";
import { normalizeOtIpKey, resolveOtDeviceNameByIp } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chart } from "react-google-charts";
import useDeviceMappingsStore from "@/stores/device-mappings-store";

type OTSankeyRecord = {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  weight: number;
  direction: "incoming_to_ot" | "outgoing_from_ot";
  highestSeverity: string;
  avgRiskScore: number;
  protocols: string;
  lastSeen: string;
};

type Props = {
  data: DashboardSankeyLinkRow[];
  observedAssetsTotal?: string | null;
  isError?: boolean;
  errorMessage?: string | null;
};

const MAX_INCOMING_FLOWS = 10;
const MAX_OUTGOING_FLOWS = 10;
const SOURCE_NODE_MARKER = "\u200B";
const DESTINATION_NODE_MARKER = "\u200C";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const OT_CORE_DEVICE_IPS = new Set(["10.40.20.10", "10.40.20.20", "10.40.20.42"]);
const MIN_SCROLLABLE_CHART_WIDTH = 720;
const SANKEY_PALETTE = ["#22d3ee", "#34d399", "#f59e0b", "#fb7185", "#a78bfa", "#60a5fa", "#f472b6", "#84cc16"];

function getChartViewportMode(width: number): "compact" | "medium" | "wide" {
  if (width > 0 && width < 640) {
    return "compact";
  }

  if (width > 0 && width < 1100) {
    return "medium";
  }

  return "wide";
}

function getChartHeight(mode: "compact" | "medium" | "wide"): number {
  if (mode === "compact") {
    return 360;
  }

  if (mode === "medium") {
    return 420;
  }

  return 480;
}

function sanitizeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseDestinationTarget(target: string): { ip: string; port: string | null } {
  const separatorIndex = target.lastIndexOf(":");
  if (separatorIndex <= 0) {
    return { ip: target, port: null };
  }

  const ip = target.slice(0, separatorIndex);
  const portRaw = target.slice(separatorIndex + 1);
  const port = portRaw && portRaw !== "*" ? portRaw : null;
  return { ip, port };
}

function normalizeIp(value: string | null | undefined): string {
  return normalizeOtIpKey(value);
}

function isOtCoreDeviceIp(ip: string): boolean {
  return OT_CORE_DEVICE_IPS.has(normalizeIp(ip));
}

function getSeverityRank(severity: string): number {
  if (severity === "critical") {
    return 4;
  }

  if (severity === "high") {
    return 3;
  }

  if (severity === "medium") {
    return 2;
  }

  return 1;
}

type EdgeAggregate = {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  direction: "incoming_to_ot" | "outgoing_from_ot";
  weight: number;
  severityRank: number;
  highestSeverity: string;
  riskWeightedTotal: number;
  weightTotal: number;
  protocolSet: Set<string>;
  lastSeen: string;
};

function makeSourceNodeId(label: string): string {
  return `${label}${SOURCE_NODE_MARKER}`;
}

function makeDestinationNodeId(label: string): string {
  return `${label}${DESTINATION_NODE_MARKER}`;
}

function upsertEdge(
  container: Map<string, EdgeAggregate>,
  {
    fromId,
    toId,
    fromLabel,
    toLabel,
    direction,
  }: {
    fromId: string;
    toId: string;
    fromLabel: string;
    toLabel: string;
    direction: "incoming_to_ot" | "outgoing_from_ot";
  },
  row: DashboardSankeyLinkRow,
) {
  const key = `${fromId}|${toId}|${direction}`;
  const existing = container.get(key);

  if (!existing) {
    container.set(key, {
      fromId,
      toId,
      fromLabel,
      toLabel,
      direction,
      weight: row.weight,
      severityRank: getSeverityRank(row.highestSeverity),
      highestSeverity: row.highestSeverity,
      riskWeightedTotal: row.avgRiskScore * row.weight,
      weightTotal: row.weight,
      protocolSet: new Set(
        row.protocols
          .split(",")
          .map((protocol) => protocol.trim())
          .filter(Boolean),
      ),
      lastSeen: row.lastSeen,
    });
    return;
  }

  existing.weight += row.weight;
  existing.riskWeightedTotal += row.avgRiskScore * row.weight;
  existing.weightTotal += row.weight;

  const incomingSeverityRank = getSeverityRank(row.highestSeverity);
  if (incomingSeverityRank > existing.severityRank) {
    existing.severityRank = incomingSeverityRank;
    existing.highestSeverity = row.highestSeverity;
  }

  row.protocols
    .split(",")
    .map((protocol) => protocol.trim())
    .filter(Boolean)
    .forEach((protocol) => existing.protocolSet.add(protocol));

  if (+new Date(row.lastSeen) > +new Date(existing.lastSeen)) {
    existing.lastSeen = row.lastSeen;
  }
}

function toSankeyRecord(item: EdgeAggregate): OTSankeyRecord {
  return {
    fromId: item.fromId,
    toId: item.toId,
    fromLabel: item.fromLabel,
    toLabel: item.toLabel,
    weight: item.weight,
    direction: item.direction,
    highestSeverity: item.highestSeverity,
    avgRiskScore: item.weightTotal > 0 ? Number((item.riskWeightedTotal / item.weightTotal).toFixed(1)) : 0,
    protocols: Array.from(item.protocolSet).sort().join(", "),
    lastSeen: item.lastSeen,
  };
}

function buildCenterlinePath(linkPathData: string): string | null {
  const values = (linkPathData.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
  if (values.length < 16) {
    return null;
  }

  const [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6, x7, y7] = values;
  if (![x0, y0, x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6, x7, y7].every(Number.isFinite)) {
    return null;
  }

  const startX = (x0 + x7) / 2;
  const startY = (y0 + y7) / 2;
  const endX = (x3 + x4) / 2;
  const endY = (y3 + y4) / 2;
  const control1X = (x1 + x6) / 2;
  const control1Y = (y1 + y6) / 2;
  const control2X = (x2 + x5) / 2;
  const control2Y = (y2 + y5) / 2;

  return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endX},${endY}`;
}

export default function DashboardSankeyCommunicationCard({
  data,
  observedAssetsTotal = null,
  isError = false,
  errorMessage = null,
}: Props) {
  const chartViewportRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const deviceMappings = useDeviceMappingsStore((state) => state.mappings);
  const mappedIpNameByAddress = useMemo(() => {
    const next = new Map<string, string>();

    deviceMappings.forEach((mapping) => {
      if (!mapping.is_active || mapping.mapping_type !== "ip" || !mapping.ip_address) {
        return;
      }

      const normalizedIp = normalizeIp(mapping.ip_address);
      const normalizedDisplayName = mapping.display_name?.trim();
      if (!normalizedIp || !normalizedDisplayName || next.has(normalizedIp)) {
        return;
      }

      next.set(normalizedIp, normalizedDisplayName);
    });

    return next;
  }, [deviceMappings]);
  const getHostDisplayLabel = useCallback((ip: string) => {
    const normalized = normalizeIp(ip);
    if (!normalized) {
      return normalized;
    }

    const mappedName = mappedIpNameByAddress.get(normalized);
    if (mappedName) {
      return mappedName;
    }

    return resolveOtDeviceNameByIp(normalized) ?? normalized;
  }, [mappedIpNameByAddress]);

  const incomingEdges = new Map<string, EdgeAggregate>();
  const outgoingEdges = new Map<string, EdgeAggregate>();

  data.forEach((row) => {
    const sourceIp = row.source;
    const { ip: destinationIp } = parseDestinationTarget(row.target);
    const sourceIsCore = isOtCoreDeviceIp(sourceIp);
    const destinationIsCore = isOtCoreDeviceIp(destinationIp);

    if (!sourceIsCore && destinationIsCore) {
      const sourceLabel = getHostDisplayLabel(sourceIp);
      const otCoreDevice = getHostDisplayLabel(destinationIp);
      upsertEdge(
        incomingEdges,
        {
          fromId: makeSourceNodeId(sourceLabel),
          toId: otCoreDevice,
          fromLabel: sourceLabel,
          toLabel: otCoreDevice,
          direction: "incoming_to_ot",
        },
        row,
      );
    }

    if (sourceIsCore && !destinationIsCore) {
      const otCoreDevice = getHostDisplayLabel(sourceIp);
      const destinationLabel = getHostDisplayLabel(destinationIp);
      upsertEdge(
        outgoingEdges,
        {
          fromId: otCoreDevice,
          toId: makeDestinationNodeId(destinationLabel),
          fromLabel: otCoreDevice,
          toLabel: destinationLabel,
          direction: "outgoing_from_ot",
        },
        row,
      );
    }
  });

  const flowData: OTSankeyRecord[] = [
    ...Array.from(incomingEdges.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_INCOMING_FLOWS)
      .map(toSankeyRecord),
    ...Array.from(outgoingEdges.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, MAX_OUTGOING_FLOWS)
      .map(toSankeyRecord),
  ];

  const subsetSummary = [
    `Top ${MAX_INCOMING_FLOWS} in + top ${MAX_OUTGOING_FLOWS} out OT communication paths.`,
    observedAssetsTotal ? `Subset of ${observedAssetsTotal} total KPI assets.` : "",
  ].filter(Boolean).join(" ");
  const viewportMode = getChartViewportMode(viewportWidth);
  const chartHeight = getChartHeight(viewportMode);
  const shouldAllowHorizontalScroll = viewportMode === "compact";
  const chartWidthBucket = viewportMode;

  const chartData: (string | number | { role: string; type: string; p: { html: boolean } })[][] = [
    ["From", "To", "Sessions", { role: "tooltip", type: "string", p: { html: true } }],
    ...flowData.map((row) => [
      row.fromId,
      row.toId,
      row.weight,
      `
      <div style="font-size:12px;line-height:1.45;color:#e2e8f0;background:#1a1f2e;border:1px solid #2d3748;border-radius:8px;padding:10px 12px;">
        <div style="font-weight:600;margin-bottom:4px;">From: ${sanitizeHtml(row.fromLabel)}</div>
        <div style="margin-bottom:2px;">To: ${sanitizeHtml(row.toLabel)}</div>
        <div style="margin-bottom:2px;">Direction: ${sanitizeHtml(row.direction === "incoming_to_ot" ? "source IP -> OT core device" : "OT core device -> destination IP")}</div>
        <div style="margin-bottom:2px;">Severity: ${sanitizeHtml(row.highestSeverity)}</div>
        <div style="margin-bottom:2px;">Protocols: ${sanitizeHtml(row.protocols)}</div>
        <div style="margin-bottom:2px;">Last seen: ${sanitizeHtml(formatDashboardDatetime(row.lastSeen))}</div>
        <div style="color:#67e8f9;font-weight:600;">Sessions: ${formatNumberShort(row.weight)} • Avg risk: ${row.avgRiskScore}</div>
      </div>
      `,
    ]),
  ];

  const chartOptions = useMemo(() => ({
    backgroundColor: "transparent",
    tooltip: { isHtml: true, trigger: "focus" as const },
    sankey: {
      node: {
        colors: SANKEY_PALETTE,
        width: viewportMode === "compact" ? 10 : 14,
        nodePadding: viewportMode === "compact" ? 12 : viewportMode === "medium" ? 16 : 18,
        interactivity: true,
        label: {
          color: "#f8fafc",
          fontSize: viewportMode === "compact" ? 10 : 12,
        },
      },
      link: {
        colorMode: "source" as const,
        colors: SANKEY_PALETTE,
        color: {
          fillOpacity: 0.42,
          stroke: "none",
        },
      },
    },
  }), [viewportMode]);

  const clearFlowParticles = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    container
      .querySelectorAll<SVGElement>(
        ".zcrot-sankey-flow-stream, .zcrot-sankey-flow-stream-soft, .zcrot-sankey-flow-comet",
      )
      .forEach((element) => element.remove());
  }, []);

  const applyFlowParticles = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    const svg = container.querySelector("svg");
    if (!svg) {
      return;
    }

    clearFlowParticles();

    const classMatchedPaths = Array.from(
      svg.querySelectorAll<SVGPathElement>("path.google-visualization-sankey-link"),
    );

    const candidatePaths = classMatchedPaths.length
      ? classMatchedPaths
      : Array.from(svg.querySelectorAll<SVGPathElement>("path"));

    const sankeyLinkPaths = candidatePaths.filter((path) => {
      const d = path.getAttribute("d") || "";
      if (!d || !d.includes("C")) {
        return false;
      }

      if (
        path.classList.contains("zcrot-sankey-flow-stream")
        || path.classList.contains("zcrot-sankey-flow-stream-soft")
      ) {
        return false;
      }

      const fill = path.getAttribute("fill") || getComputedStyle(path).fill;
      if (!fill || fill === "none" || fill === "transparent") {
        return false;
      }

      return true;
    });

    sankeyLinkPaths.forEach((path, index) => {
      const linkPathData = path.getAttribute("d") || "";
      const flowPathData = buildCenterlinePath(linkPathData) ?? linkPathData;
      const color = path.getAttribute("fill") || getComputedStyle(path).fill || "#38bdf8";
      const flowDurationSeconds = Math.max(1.9, Math.min(4.4, 2.6 + index * 0.1));

      const primaryStreamPath = document.createElementNS(SVG_NAMESPACE, "path");
      primaryStreamPath.setAttribute("d", flowPathData);
      primaryStreamPath.setAttribute("fill", "none");
      primaryStreamPath.setAttribute("stroke", color);
      primaryStreamPath.setAttribute("stroke-width", "2.2");
      primaryStreamPath.setAttribute("stroke-linecap", "round");
      primaryStreamPath.setAttribute("stroke-linejoin", "round");
      primaryStreamPath.setAttribute("stroke-dasharray", "2 14");
      primaryStreamPath.setAttribute("stroke-opacity", "0.5");
      primaryStreamPath.classList.add("zcrot-sankey-flow-stream");
      primaryStreamPath.style.animationDuration = `${flowDurationSeconds}s`;
      primaryStreamPath.style.animationDelay = `${(index % 5) * 0.23}s`;
      primaryStreamPath.style.pointerEvents = "none";
      path.parentNode?.insertBefore(primaryStreamPath, path.nextSibling);

      const secondaryStreamPath = document.createElementNS(SVG_NAMESPACE, "path");
      secondaryStreamPath.setAttribute("d", flowPathData);
      secondaryStreamPath.setAttribute("fill", "none");
      secondaryStreamPath.setAttribute("stroke", color);
      secondaryStreamPath.setAttribute("stroke-width", "1.35");
      secondaryStreamPath.setAttribute("stroke-linecap", "round");
      secondaryStreamPath.setAttribute("stroke-dasharray", "1 20");
      secondaryStreamPath.setAttribute("stroke-opacity", "0.34");
      secondaryStreamPath.classList.add("zcrot-sankey-flow-stream-soft");
      secondaryStreamPath.style.animationDuration = `${flowDurationSeconds + 0.9}s`;
      secondaryStreamPath.style.animationDelay = `${(index % 4) * 0.31 + 0.2}s`;
      secondaryStreamPath.style.pointerEvents = "none";
      path.parentNode?.insertBefore(secondaryStreamPath, path.nextSibling);

      const cometCount = 2;
      for (let cometIndex = 0; cometIndex < cometCount; cometIndex += 1) {
        const comet = document.createElementNS(SVG_NAMESPACE, "ellipse");
        comet.setAttribute("rx", "4.3");
        comet.setAttribute("ry", "1.35");
        comet.setAttribute("fill", color);
        comet.setAttribute("fill-opacity", "0.52");
        comet.classList.add("zcrot-sankey-flow-comet");
        comet.style.pointerEvents = "none";

        const cometOpacity = document.createElementNS(SVG_NAMESPACE, "animate");
        cometOpacity.setAttribute("attributeName", "opacity");
        cometOpacity.setAttribute("values", "0;0.9;0.9;0");
        cometOpacity.setAttribute("keyTimes", "0;0.14;0.84;1");
        cometOpacity.setAttribute("dur", `${flowDurationSeconds}s`);
        cometOpacity.setAttribute("repeatCount", "indefinite");
        cometOpacity.setAttribute("begin", `${(index % 4) * 0.2 + cometIndex * 0.75}s`);

        const cometMotion = document.createElementNS(SVG_NAMESPACE, "animateMotion");
        cometMotion.setAttribute("dur", `${flowDurationSeconds}s`);
        cometMotion.setAttribute("repeatCount", "indefinite");
        cometMotion.setAttribute("rotate", "auto");
        cometMotion.setAttribute("begin", `${(index % 5) * 0.19 + cometIndex * 0.75}s`);
        cometMotion.setAttribute("path", flowPathData);

        comet.appendChild(cometOpacity);
        comet.appendChild(cometMotion);
        path.parentNode?.insertBefore(comet, path.nextSibling);
      }
    });
  }, [clearFlowParticles]);

  const chartEvents = useMemo(
    () => [
      {
        eventName: "ready" as const,
        callback: () => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              applyFlowParticles();
            });
          });
        },
      },
    ],
    [applyFlowParticles],
  );

  useEffect(() => {
    const element = chartViewportRef.current;
    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      setViewportWidth((currentWidth) => currentWidth === width ? currentWidth : width);
    });

    resizeObserver.observe(element);
    setViewportWidth(Math.round(element.getBoundingClientRect().width));

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => () => {
    clearFlowParticles();
  }, [clearFlowParticles]);

  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden border-slate-700/40 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 py-4 shadow-[0_18px_60px_rgba(2,8,23,0.32)] sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.12),transparent_30%),linear-gradient(135deg,rgba(52,211,153,0.08),transparent_45%,rgba(244,114,182,0.08))]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />
      <CardHeader className="relative z-10 space-y-3 px-4 sm:px-6">
        <div>
          <CardTitle className="text-base tracking-normal text-slate-50 sm:text-lg">Communication Path (Who Talks to Whom)</CardTitle>
          <CardDescription className="mt-1 max-w-3xl text-xs text-slate-400">
            {subsetSummary}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 overflow-visible px-3 sm:px-6">
        {isError ? (
          <div className="flex items-center justify-center" style={{ minHeight: chartHeight }}>
            <Empty
              lottie="fail"
              label="Failed to load communication path"
              description={errorMessage ?? "Unable to load communication flow right now. Please try refresh."}
            />
          </div>
        ) : flowData.length ? (
          <>
            <div
              ref={chartViewportRef}
              className="relative w-full overflow-x-auto overflow-y-visible custom-scrollbar"
            >
              <div
                ref={chartContainerRef}
                className="relative overflow-visible"
                style={{
                  height: chartHeight,
                  minWidth: shouldAllowHorizontalScroll ? MIN_SCROLLABLE_CHART_WIDTH : undefined,
                }}
              >
                <Chart
                  key={`${chartWidthBucket}-${flowData.length}`}
                  chartType="Sankey"
                  width="100%"
                  height="100%"
                  data={chartData}
                  options={chartOptions}
                  chartEvents={chartEvents}
                  loader={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading communication flow...</div>}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight: chartHeight }}>
            <Empty
              lottie="cat"
              label="No compact path data"
              description="No flows involving mapped OT core devices were found in the selected time range."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

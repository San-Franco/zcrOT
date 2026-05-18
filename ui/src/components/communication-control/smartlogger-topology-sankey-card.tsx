import DashboardCardShell from "@/components/communication-control/communication-card-shell";
import Empty from "@/components/shared/empty";
import { formatDashboardDatetime, formatNumberShort, normalizeOtIpKey, resolveOtDeviceNameByIp, resolveOtDeviceNameByUnitId } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Chart, type ReactGoogleChartEvent } from "react-google-charts";
import useDeviceMappingsStore from "@/stores/device-mappings-store";

type SmartloggerTopologySankeyRecord = {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  direction: "gateway_to_smartlogger" | "smartlogger_to_device";
  weight: number;
  successRate: number;
  errorCount: number;
  slowCount: number;
  avgResponseTimeMs: number;
  maxResponseTimeMs: number;
  protocols: string;
  lastSeen: string;
};

type EdgeAggregate = {
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  direction: "gateway_to_smartlogger" | "smartlogger_to_device";
  weight: number;
  successCount: number;
  errorCount: number;
  slowCount: number;
  responseWeightedTotal: number;
  responseWeight: number;
  maxResponseTimeMs: number;
  protocolSet: Set<string>;
  lastSeen: string;
};

type Props = {
  rows: DashboardSmartloggerTopologyRow[];
  isError?: boolean;
  errorMessage?: string | null;
};

type SankeyChartSelectionApi = {
  setSelection: (selection: Array<{ row: number }>) => void;
};

type SankeyChartWrapperApi = {
  getChart: () => SankeyChartSelectionApi;
};

const LEFT_NODE_MARKER = "\u200B";
const RIGHT_NODE_MARKER = "\u200C";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const GATEWAY_HOST_TO_FALLBACK_IP: Record<string, string> = Object.freeze({
  "ot-gateway": "10.40.20.10",
  "ot gateway": "10.40.20.10",
  "smart logger": "10.40.20.10",
});

function normalizeGatewayHostKey(host: string): string {
  return host.trim().toLowerCase();
}

function resolveGatewayDisplayLabel(gatewayHostRaw: string): string {
  const gatewayHost = gatewayHostRaw?.trim();
  if (!gatewayHost || gatewayHost === "-") {
    return "OT Gateway / Smart Logger / Unit 0";
  }

  const mappedByDirectIp = resolveOtDeviceNameByIp(normalizeOtIpKey(gatewayHost));
  if (mappedByDirectIp) {
    return mappedByDirectIp;
  }

  const fallbackIp = GATEWAY_HOST_TO_FALLBACK_IP[normalizeGatewayHostKey(gatewayHost)];
  if (fallbackIp) {
    const mappedByFallbackIp = resolveOtDeviceNameByIp(fallbackIp);
    if (mappedByFallbackIp) {
      return mappedByFallbackIp;
    }
  }

  return gatewayHost;
}

function sanitizeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDeviceTypeLabel(deviceType: string): string {
  const normalized = deviceType.toLowerCase();
  if (normalized === "inverter") {
    return "Inverter";
  }

  if (normalized === "power_meter") {
    return "Power Meter";
  }

  if (normalized === "emi") {
    return "EMI";
  }

  return "OT Device";
}

function makeLeftNodeId(label: string): string {
  return `${label}${LEFT_NODE_MARKER}`;
}

function makeRightNodeId(label: string): string {
  return `${label}${RIGHT_NODE_MARKER}`;
}

function buildCenterlinePath(linkPathData: string, reverseDirection = false): string | null {
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

  if (reverseDirection) {
    return `M ${endX},${endY} C ${control2X},${control2Y} ${control1X},${control1Y} ${startX},${startY}`;
  }

  return `M ${startX},${startY} C ${control1X},${control1Y} ${control2X},${control2Y} ${endX},${endY}`;
}

function upsertEdge(container: Map<string, EdgeAggregate>, row: {
  key: string;
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  direction: "gateway_to_smartlogger" | "smartlogger_to_device";
  weight: number;
  successCount: number;
  errorCount: number;
  slowCount: number;
  avgResponseTimeMs: number;
  maxResponseTimeMs: number;
  protocols: string;
  lastSeen: string;
}) {
  const existing = container.get(row.key);
  const protocolValues = row.protocols
    .split(",")
    .map((protocol) => protocol.trim())
    .filter(Boolean);

  if (!existing) {
    container.set(row.key, {
      fromId: row.fromId,
      toId: row.toId,
      fromLabel: row.fromLabel,
      toLabel: row.toLabel,
      direction: row.direction,
      weight: row.weight,
      successCount: row.successCount,
      errorCount: row.errorCount,
      slowCount: row.slowCount,
      responseWeightedTotal: row.avgResponseTimeMs * row.weight,
      responseWeight: row.weight,
      maxResponseTimeMs: row.maxResponseTimeMs,
      protocolSet: new Set(protocolValues),
      lastSeen: row.lastSeen,
    });
    return;
  }

  existing.weight += row.weight;
  existing.successCount += row.successCount;
  existing.errorCount += row.errorCount;
  existing.slowCount += row.slowCount;
  existing.responseWeightedTotal += row.avgResponseTimeMs * row.weight;
  existing.responseWeight += row.weight;
  existing.maxResponseTimeMs = Math.max(existing.maxResponseTimeMs, row.maxResponseTimeMs);
  protocolValues.forEach((protocol) => existing.protocolSet.add(protocol));

  if (+new Date(row.lastSeen) > +new Date(existing.lastSeen)) {
    existing.lastSeen = row.lastSeen;
  }
}

function toSankeyRecord(item: EdgeAggregate): SmartloggerTopologySankeyRecord {
  const successRate = item.weight > 0 ? (item.successCount / item.weight) * 100 : 0;

  return {
    fromId: item.fromId,
    toId: item.toId,
    fromLabel: item.fromLabel,
    toLabel: item.toLabel,
    direction: item.direction,
    weight: item.weight,
    successRate: Number(successRate.toFixed(1)),
    errorCount: item.errorCount,
    slowCount: item.slowCount,
    avgResponseTimeMs: item.responseWeight > 0
      ? Number((item.responseWeightedTotal / item.responseWeight).toFixed(2))
      : 0,
    maxResponseTimeMs: Number(item.maxResponseTimeMs.toFixed(2)),
    protocols: Array.from(item.protocolSet).sort().join(", "),
    lastSeen: item.lastSeen,
  };
}

export default function DashboardSmartloggerTopologySankeyCard({
  rows,
  isError = false,
  errorMessage = null,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<SankeyChartSelectionApi | null>(null);
  const deviceMappings = useDeviceMappingsStore((state) => state.mappings);

  const sankeyRows = useMemo<SmartloggerTopologySankeyRecord[]>(() => {
    const gatewayToSmartlogger = new Map<string, EdgeAggregate>();
    const smartloggerToDevice = new Map<string, EdgeAggregate>();

    rows.forEach((row) => {
      const gatewayLabel = resolveGatewayDisplayLabel(row.gatewayHost);
      const smartloggerLabel = `SmartLogger 3000 (${row.smartloggerIp}:${row.smartloggerPort})`;
      const mappedUnitName = resolveOtDeviceNameByUnitId(row.unitId);
      const deviceLabel = mappedUnitName || `${getDeviceTypeLabel(row.deviceType)} (Unit ${row.unitId})`;

      upsertEdge(gatewayToSmartlogger, {
        key: `${gatewayLabel}|${smartloggerLabel}`,
        fromId: makeLeftNodeId(gatewayLabel),
        toId: smartloggerLabel,
        fromLabel: gatewayLabel,
        toLabel: smartloggerLabel,
        direction: "gateway_to_smartlogger",
        weight: row.totalRequests,
        successCount: row.successCount,
        errorCount: row.errorCount,
        slowCount: row.slowCount,
        avgResponseTimeMs: row.avgResponseTimeMs,
        maxResponseTimeMs: row.maxResponseTimeMs,
        protocols: row.protocols,
        lastSeen: row.lastSeen,
      });

      upsertEdge(smartloggerToDevice, {
        key: `${smartloggerLabel}|${deviceLabel}|${row.unitId}`,
        fromId: smartloggerLabel,
        toId: makeRightNodeId(deviceLabel),
        fromLabel: smartloggerLabel,
        toLabel: deviceLabel,
        direction: "smartlogger_to_device",
        weight: row.totalRequests,
        successCount: row.successCount,
        errorCount: row.errorCount,
        slowCount: row.slowCount,
        avgResponseTimeMs: row.avgResponseTimeMs,
        maxResponseTimeMs: row.maxResponseTimeMs,
        protocols: row.protocols,
        lastSeen: row.lastSeen,
      });
    });

    return [
      ...Array.from(gatewayToSmartlogger.values()).map(toSankeyRecord),
      ...Array.from(smartloggerToDevice.values()).map(toSankeyRecord),
    ];
  }, [deviceMappings, rows]);

  const totals = useMemo(() => {
    const totalRequests = rows.reduce((sum, row) => sum + row.totalRequests, 0);
    const totalErrors = rows.reduce((sum, row) => sum + row.errorCount, 0);
    const totalSlow = rows.reduce((sum, row) => sum + row.slowCount, 0);
    const latestSeen = rows.reduce<string | null>((latest, row) => {
      if (!latest) {
        return row.lastSeen;
      }

      return +new Date(row.lastSeen) > +new Date(latest) ? row.lastSeen : latest;
    }, null);

    return {
      totalRequests,
      totalErrors,
      totalSlow,
      latestSeen,
    };
  }, [rows]);

  const chartData: (string | number | { role: string; type: string; p: { html: boolean } })[][] = [
    ["From", "To", "Requests", { role: "tooltip", type: "string", p: { html: true } }],
    ...sankeyRows.map((row) => [
      row.fromId,
      row.toId,
      row.weight,
      `
      <div style="font-size:12px;line-height:1.45;color:#e2e8f0;background:#1a1f2e;border:1px solid #2d3748;border-radius:8px;padding:10px 12px;">
        <div style="font-weight:600;margin-bottom:4px;">From: ${sanitizeHtml(row.fromLabel)}</div>
        <div style="margin-bottom:2px;">To: ${sanitizeHtml(row.toLabel)}</div>
        <div style="margin-bottom:2px;">Path: ${sanitizeHtml(row.direction === "gateway_to_smartlogger" ? "OT Gateway -> Smart Logger telemetry" : "Smart Logger -> logical OT unit")}</div>
        <div style="margin-bottom:2px;">Protocols: ${sanitizeHtml(row.protocols || "modbus_tcp")}</div>
        <div style="margin-bottom:2px;">Success: ${sanitizeHtml(String(row.successRate))}%</div>
        <div style="margin-bottom:2px;">Errors / Slow: ${sanitizeHtml(String(row.errorCount))} / ${sanitizeHtml(String(row.slowCount))}</div>
        <div style="margin-bottom:2px;">Avg / Max ms: ${sanitizeHtml(String(row.avgResponseTimeMs))} / ${sanitizeHtml(String(row.maxResponseTimeMs))}</div>
        <div style="color:#67e8f9;font-weight:600;">Requests: ${formatNumberShort(row.weight)} • Last seen: ${sanitizeHtml(formatDashboardDatetime(row.lastSeen))}</div>
      </div>
      `,
    ]),
  ];

  const chartOptions = {
    backgroundColor: "transparent",
    tooltip: { isHtml: true, trigger: "focus" as const },
    sankey: {
      node: {
        colors: ["#38bdf8", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#8b5cf6"],
        width: 12,
        nodePadding: 18,
        interactivity: true,
        label: {
          color: "#f8fafc",
          fontSize: 11,
        },
      },
      link: {
        colorMode: "source" as const,
        colors: ["#38bdf8", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#8b5cf6"],
        color: {
          fillOpacity: 0.35,
          stroke: "none",
        },
      },
    },
  };

  const clearFlowParticles = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container) {
      return;
    }

    container
      .querySelectorAll<SVGElement>(
        ".zcrot-sankey-flow-stream, .zcrot-sankey-flow-stream-soft, .zcrot-sankey-flow-stream-rtl, .zcrot-sankey-flow-stream-soft-rtl, .zcrot-sankey-flow-comet",
      )
      .forEach((element) => element.remove());
  }, []);

  const clearTooltipAndSelection = useCallback(() => {
    chartApiRef.current?.setSelection([]);
    document
      .querySelectorAll<HTMLElement>(".google-visualization-tooltip")
      .forEach((tooltip) => {
        tooltip.style.display = "none";
      });
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
        || path.classList.contains("zcrot-sankey-flow-stream-rtl")
        || path.classList.contains("zcrot-sankey-flow-stream-soft-rtl")
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
      const flowPathData = buildCenterlinePath(linkPathData, true) ?? linkPathData;
      const color = path.getAttribute("fill") || getComputedStyle(path).fill || "#38bdf8";
      const flowDurationSeconds = Math.max(1.8, Math.min(4.3, 2.5 + index * 0.1));

      const primaryStreamPath = document.createElementNS(SVG_NAMESPACE, "path");
      primaryStreamPath.setAttribute("d", flowPathData);
      primaryStreamPath.setAttribute("fill", "none");
      primaryStreamPath.setAttribute("stroke", color);
      primaryStreamPath.setAttribute("stroke-width", "2.2");
      primaryStreamPath.setAttribute("stroke-linecap", "round");
      primaryStreamPath.setAttribute("stroke-linejoin", "round");
      primaryStreamPath.setAttribute("stroke-dasharray", "2 14");
      primaryStreamPath.setAttribute("stroke-opacity", "0.5");
      primaryStreamPath.classList.add("zcrot-sankey-flow-stream-rtl");
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
      secondaryStreamPath.classList.add("zcrot-sankey-flow-stream-soft-rtl");
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

  const chartEvents = useMemo<ReactGoogleChartEvent[]>(
    () => [
      {
        eventName: "ready" as const,
        callback: ({ chartWrapper }) => {
          const wrapper = chartWrapper as unknown as SankeyChartWrapperApi | null;
          if (!wrapper) {
            return;
          }
          chartApiRef.current = wrapper.getChart();
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              applyFlowParticles();
            });
          });
        },
      },
    ],
    [applyFlowParticles, clearTooltipAndSelection],
  );

  useEffect(() => () => {
    clearTooltipAndSelection();
    chartApiRef.current = null;
    clearFlowParticles();
  }, [clearFlowParticles, clearTooltipAndSelection]);

  return (
    <DashboardCardShell
      title="SmartLogger Polling Topology (Logical)"
      description="Logical polling path: OT Gateway / Smart Logger -> downstream units (Solar Inverter / Power Meter / Environmental Sensor)."
      className="min-h-0"
      contentClassName="flex flex-col"
    >
      {isError ? (
        <div className="flex h-full items-center justify-center">
          <Empty
            lottie="fail"
            label="Failed to load SmartLogger topology"
            description={errorMessage ?? "Unable to load SmartLogger polling topology right now."}
          />
        </div>
      ) : sankeyRows.length ? (
        <>
          <div
            ref={chartContainerRef}
            className="relative h-67.5 w-full overflow-visible md:h-72.5"
            onMouseLeave={clearTooltipAndSelection}
          >
            <Chart
              chartType="Sankey"
              width="100%"
              height="100%"
              data={chartData}
              options={chartOptions}
              chartEvents={chartEvents}
              loader={<div className="flex h-full items-center justify-center text-sm text-slate-400">Loading SmartLogger topology...</div>}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Total requests: {formatNumberShort(totals.totalRequests)}</span>
            <span>&bull;</span>
            <span>Errors: {formatNumberShort(totals.totalErrors)}</span>
            <span>&bull;</span>
            <span>Slow polls: {formatNumberShort(totals.totalSlow)}</span>
            {totals.latestSeen && (
              <>
                <span>&bull;</span>
                <span>Last seen: {formatDashboardDatetime(totals.latestSeen)}</span>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <Empty
            label="No SmartLogger topology data"
            description="No Modbus polling summaries match the current time range."
          />
        </div>
      )}
    </DashboardCardShell>
  );
}

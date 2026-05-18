import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDashboardDatetime, isExternalSourceIp } from "@/lib/utils";
import { formatOtHostLabel, resolveOtDeviceNameByIp } from "@/lib/utils";
import CustomBadge from "@/components/shared/custom-badge";
import { Copy, Globe, Hash, Server, Shield, User, Zap } from "lucide-react";
import { FiCode, FiFileText, FiSettings } from "react-icons/fi";
import { toast } from "sonner";

type Props = {
  event: DashboardNetworkEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getRawLogField(rawLog: string, fieldName: string) {
  const match = rawLog.match(new RegExp(`(?:^|\\s)${fieldName}=([^\\s]+)`));
  return match ? match[1] : null;
}

export default function DashboardEventDetailDrawer({ event, open, onOpenChange }: Props) {
  if (!event) {
    return null;
  }

  const scenarioType = getRawLogField(event.rawLog, "scenario_type");
  const correlationConfidence = getRawLogField(event.rawLog, "correlation_confidence");
  const outsideBusinessHours = event.outsideBusinessHours
    ? "true"
    : (getRawLogField(event.rawLog, "outside_business_hours") ?? "false");
  const modbusDisrupted = event.modbusDisrupted
    ? "true"
    : (getRawLogField(event.rawLog, "modbus_disrupted") ?? "false");
  const correlationNote = getRawLogField(event.rawLog, "correlation_note");
  const identity = isExternalSourceIp(event.sourceIp) ? "external" : event.unknownClient ? "unknown" : "known";
  const sourceFriendlyName = formatOtHostLabel(event.sourceIp);
  const destinationFriendlyName = formatOtHostLabel(event.destinationIp);
  const hasSourceMapping = Boolean(resolveOtDeviceNameByIp(event.sourceIp));
  const hasDestinationMapping = Boolean(resolveOtDeviceNameByIp(event.destinationIp));

  async function handleCopyRawMessage() {
    const rawLog = event?.rawLog;

    if (!rawLog) {
      return;
    }

    try {
      await navigator.clipboard.writeText(rawLog);
      toast.success("Success", { description: "Raw message copied to clipboard." });
    } catch {
      toast.error("Copy Failed", { description: "Unable to copy raw message." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-999 max-h-[90vh] overflow-y-auto border-dark-border/50 bg-linear-to-b from-dark-surface via-dark-surface/95 to-dark-bg no-scrollbar sm:max-w-270">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FiFileText className="text-zcr-blue" />
            <span>Security Event Details</span>
          </DialogTitle>
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center">
            <span>{formatDashboardDatetime(event.timestamp)}</span>
            <span className="hidden lg:inline">&bull;</span>
            <span className="text-zcr-blue">Event ID: {event.id}</span>
          </div>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={["overview"]} className="w-full space-y-3">
          <AccordionItem
            value="overview"
            className="rounded-xl border border-dark-border/30 bg-linear-to-br from-dark-surface/80 to-dark-bg/60 backdrop-blur-sm"
          >
            <AccordionTrigger className="group px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-zcr-blue/10 p-1.5 transition-colors group-hover:bg-zcr-blue/20">
                  <FiFileText className="h-4 w-4 text-zcr-blue" />
                </div>
                <span className="text-base font-semibold">Overview</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Server className="h-3.5 w-3.5" />
                    Severity
                  </label>
                  <CustomBadge kind="severity" value={event.severity} />
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    Verdict
                  </label>
                  <CustomBadge kind="verdict" value={event.verdict} />
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Identity
                  </label>
                  <CustomBadge kind="identity" value={identity} />
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Source IP
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    <div className="font-medium">{sourceFriendlyName}</div>
                    {hasSourceMapping && <div className="font-mono text-xs text-muted-foreground">{event.sourceIp}</div>}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Destination IP
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    <div className="font-medium">{destinationFriendlyName}</div>
                    {hasDestinationMapping && (
                      <div className="font-mono text-xs text-muted-foreground">{event.destinationIp}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Destination Port
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-blue-400">
                    {event.destinationPort ?? "-"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    Protocol
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm font-medium text-green-400">
                    {event.protocol.toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    Direction
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-orange-400">{event.direction.replace(/_/g, " ")}</div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    Risk Score
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-dark-text">{event.riskScore}</div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3 md:col-span-2 xl:col-span-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FiFileText className="h-3.5 w-3.5" />
                    Classification / Message
                  </label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-2 text-sm text-dark-text">
                    <p className="font-medium text-slate-100">{event.classification}</p>
                    <p className="mt-1 text-slate-300">{event.message}</p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="technical"
            className="rounded-xl border border-dark-border/30 bg-linear-to-br from-dark-surface/80 to-dark-bg/60 backdrop-blur-sm"
          >
            <AccordionTrigger className="group px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md bg-zcr-blue/10 p-1.5 transition-colors group-hover:bg-zcr-blue/20">
                  <FiSettings className="h-4 w-4 text-zcr-blue" />
                </div>
                <span className="text-base font-semibold">Technical Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Timestamp</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-dark-text">{event.timestamp}</div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Traffic Type</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">{event.trafficType}</div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Source Port</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-dark-text">
                    {event.sourcePort ?? "-"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Source MAC</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-dark-text">
                    {event.sourceMac || "-"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Destination MAC</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 font-mono text-sm text-dark-text">
                    {event.destinationMac || "-"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">External Source</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    {isExternalSourceIp(event.sourceIp) ? "Yes" : "No"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Scenario Type</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    {scenarioType ?? "Not present in this record"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Correlation Confidence</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    {correlationConfidence ?? "Not present in this record"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Outside Business Hours</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    {outsideBusinessHours ?? "Not present in this record"}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3">
                  <label className="text-xs font-medium text-muted-foreground">Modbus Disrupted</label>
                  <div className="rounded-md bg-dark-surface/80 px-3 py-1.5 text-sm text-dark-text">
                    {modbusDisrupted ?? "Not present in this record"}
                  </div>
                </div>
                {correlationNote && (
                  <div className="space-y-2 rounded-lg border border-dark-border/20 bg-dark-bg/50 p-3 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Correlation Note</label>
                    <div className="rounded-md bg-dark-surface/80 px-3 py-2 text-sm text-slate-100">{correlationNote}</div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="raw"
            className="rounded-xl border border-dark-border/30 bg-linear-to-br from-dark-surface/80 to-dark-bg/60 backdrop-blur-sm"
          >
            <AccordionTrigger className="group px-4 py-3 hover:no-underline">
              <div className="flex w-full items-center justify-between pr-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-md bg-zcr-blue/10 p-1.5 transition-colors group-hover:bg-zcr-blue/20">
                    <FiCode className="h-4 w-4 text-zcr-blue" />
                  </div>
                  <span className="text-base font-semibold">Raw Message</span>
                </div>
                {event.rawLog && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(eventClick) => {
                      eventClick.stopPropagation();
                      void handleCopyRawMessage();
                    }}
                    className="cursor-pointer gap-2 transition-colors hover:bg-zcr-blue/10 hover:text-zcr-blue"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2 pb-4">
              <div className="overflow-x-auto rounded-lg border border-dark-border/20 bg-dark-bg/80 p-4">
                <pre className="wrap-break-words whitespace-pre-wrap font-mono text-xs leading-relaxed text-dark-text/90">
                  {event.rawLog || event.message || "No raw message available"}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-2 flex justify-end border-t border-dark-border/50 pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="min-h-11 cursor-pointer px-8 font-medium">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import {
  CONFIDENTIALITY_NOTICE,
  REPORT_PROVIDER,
  REPORT_SECTIONS,
  REPORT_TITLE,
} from '../../constants';
import type { AiInsight, ReportData, SectionId } from '../../types';
import { formatReportDate } from '../../utils/date-utils';
import {
  deriveReportMetrics,
  deriveReportRisks,
} from '../../utils/report-derivations';

export type InsightMap = Partial<Record<SectionId, AiInsight>>;

export type ExportBlock =
  | { type: 'paragraph'; text: string; muted?: boolean; bold?: boolean }
  | { type: 'subheading'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'limitation'; title: string; description: string; mitigation: string }
  | { type: 'risk'; title: string; category: string; severity: string; description: string; recommendation: string };

export interface ExportSection {
  number: number;
  title: string;
  blocks: ExportBlock[];
}

export interface ExportDocumentContent {
  cover: {
    reportLabel: string;
    title: string;
    clientName: string;
    periodLabel: string;
    providerLabel: string;
    confidentialityNotice: string;
  };
  sections: ExportSection[];
}

function getSectionMeta(id: SectionId) {
  return REPORT_SECTIONS.find((section) => section.id === id)!;
}

function buildSectionBlocks(
  insight: AiInsight | undefined,
  evidenceTitle: string,
  evidenceBlocks: ExportBlock[],
  fallbackSummary: string,
  fallbackRecommendation: string,
): ExportBlock[] {
  const blocks: ExportBlock[] = [];
  const recommendationText = (insight?.suggestion || fallbackRecommendation).trim();

  if (insight?.error) {
    blocks.push({ type: 'paragraph', text: insight.error, muted: true });
  } else {
    blocks.push({ type: 'paragraph', text: insight?.summary || fallbackSummary });
  }

  blocks.push({ type: 'subheading', text: evidenceTitle });
  blocks.push(...evidenceBlocks);

  if (recommendationText.length > 0) {
    blocks.push({ type: 'subheading', text: 'Recommendation' });
    blocks.push({ type: 'paragraph', text: recommendationText });
  }

  return blocks;
}

export function buildExportContent(
  data: ReportData,
  insights: InsightMap = {},
): ExportDocumentContent {
  const metrics = deriveReportMetrics(data);
  const risks = deriveReportRisks(data);
  const topProtocols = metrics.communication.protocolBreakdown
    .slice(0, 4)
    .map((item) => `${item.protocol} (${item.events.toLocaleString()})`)
    .join(', ');

  const sections: ExportSection[] = [
    {
      number: getSectionMeta('executive-summary').number,
      title: getSectionMeta('executive-summary').title,
      blocks: buildSectionBlocks(
        insights['executive-summary'],
        'Evidence Snapshot',
        [
          {
            type: 'bullets',
            items: [
              `Reporting window: ${metrics.dateRange.periodLabel}`,
              `${metrics.otAssets.otAssetCount.toLocaleString()} OT unit_id assets and ${metrics.communication.communicationPaths.toLocaleString()} communication paths were analyzed.`,
              `${metrics.devices.knownDevices.toLocaleString()} known mapped devices and ${metrics.devices.unknownDevices.toLocaleString()} unknown observed devices were identified.`,
              `${metrics.risk.totalSecurityEvents.toLocaleString()} security events were recorded, including ${metrics.risk.highSeverityEvents.toLocaleString()} high/critical events.`,
            ],
          },
        ],
        metrics.narratives.executiveSummary,
        '',
      ),
    },
    {
      number: getSectionMeta('environment-overview').number,
      title: getSectionMeta('environment-overview').title,
      blocks: buildSectionBlocks(
        insights['environment-overview'],
        'Monitoring Scope And Data Basis',
        [
          {
            type: 'bullets',
            items: [
              `Site: ${data.config.clientName}`,
              `Monitoring scope: passive OT telemetry during ${metrics.dateRange.periodLabel}`,
              `${metrics.communication.flowEvents.toLocaleString()} flow events were observed across ${metrics.communication.communicationPaths.toLocaleString()} paths.`,
              `OT assets detected by unit_id: ${metrics.otAssets.otAssetCount.toLocaleString()}`,
              `Top observed protocols: ${topProtocols || 'No protocol evidence available'}`,
            ],
          },
        ],
        metrics.narratives.environmentOverview,
        '',
      ),
    },
    {
      number: getSectionMeta('asset-visibility-summary').number,
      title: getSectionMeta('asset-visibility-summary').title,
      blocks: buildSectionBlocks(
        insights['asset-visibility-summary'],
        'Asset Visibility Evidence',
        [
          {
            type: 'bullets',
            items: [
              `OT assets (unit_id): ${metrics.otAssets.otAssetCount.toLocaleString()}`,
              `Observed communication IP assets: ${metrics.devices.observedAssets.toLocaleString()}`,
              `Known devices: ${metrics.devices.knownDevices.toLocaleString()} active mapped IPs`,
              `Unknown devices: ${metrics.devices.unknownDevices.toLocaleString()} observed unmapped IPs`,
              `OT unit continuity: ${metrics.otAssets.reportingUnitCount.toLocaleString()} reporting, ${metrics.otAssets.staleOrMissingUnitCount.toLocaleString()} stale/missing/offline`,
            ],
          },
        ],
        metrics.narratives.assetVisibility,
        '',
      ),
    },
    {
      number: getSectionMeta('communication-overview').number,
      title: getSectionMeta('communication-overview').title,
      blocks: buildSectionBlocks(
        insights['communication-overview'],
        'Communication And Control Evidence',
        [
          {
            type: 'bullets',
            items: [
              `${metrics.communication.communicationPaths.toLocaleString()} communication paths were observed in selected period.`,
              `Primary participant by event volume: ${metrics.communication.primaryParticipant}`,
              `Modbus reliability: ${metrics.communication.modbusSuccessRate}% success from ${metrics.communication.modbusRequests.toLocaleString()} requests and ${metrics.communication.modbusErrors.toLocaleString()} errors`,
              `${metrics.communication.unknownDirectionPaths.toLocaleString()} paths had unclear direction labeling in current evidence.`,
              `${metrics.communication.highRiskFlows.toLocaleString()} high-risk flows (max risk >= 70) were identified.`,
            ],
          },
        ],
        metrics.narratives.communication,
        '',
      ),
    },
    {
      number: getSectionMeta('alerts-and-risk-findings').number,
      title: getSectionMeta('alerts-and-risk-findings').title,
      blocks: buildSectionBlocks(
        insights['alerts-and-risk-findings'],
        'Risk Evidence',
        [
          ...(risks.length > 0
            ? risks.map((risk) => ({
                type: 'risk' as const,
                title: risk.title,
                category: risk.category,
                severity: risk.severity.toUpperCase(),
                description: risk.description,
                recommendation: risk.recommendation,
              }))
            : [{ type: 'paragraph' as const, text: 'No major risk observations were elevated from this reporting-period telemetry.' }]),
          {
            type: 'bullets',
            items: [
              `Total incidents in selected period: ${metrics.incidents.totalIncidentCount.toLocaleString()} (${metrics.incidents.openIncidentCount.toLocaleString()} open).`,
              `Incident grouping method: ${metrics.incidents.groupingStrategy}`,
              ...metrics.incidents.topIncidentGroups.slice(0, 3).map(
                (group) => `${group.groupKey}: ${group.incidentCount.toLocaleString()} incidents, ${group.openIncidentCount.toLocaleString()} open`,
              ),
            ],
          },
        ],
        metrics.narratives.risk,
        'Prioritize investigation on high-risk sources and high-severity events, then validate whether observed patterns align with expected operations.',
      ),
    },
    {
      number: getSectionMeta('detection-rule-summary').number,
      title: getSectionMeta('detection-rule-summary').title,
      blocks: buildSectionBlocks(
        insights['detection-rule-summary'],
        'Detection Readiness Evidence',
        [
          {
            type: 'bullets',
            items: metrics.detection.feasibilityRows.map(
              (row) => `${row.detectionType}: ${row.feasibility} — ${row.evidenceBasis}`,
            ),
          },
          {
            type: 'bullets',
            items: [
              `Rules in scope: ${metrics.detection.totalRuleCount.toLocaleString()} total (${metrics.detection.defaultRuleCount.toLocaleString()} default, ${metrics.detection.customRuleCount.toLocaleString()} custom).`,
              `In-period incidents: ${metrics.incidents.totalIncidentCount.toLocaleString()} (${metrics.incidents.openIncidentCount.toLocaleString()} open).`,
            ],
          },
        ],
        metrics.narratives.detection,
        'Use low-feasibility objectives to guide telemetry and visibility improvements for stronger detection outcomes.',
      ),
    },
    {
      number: getSectionMeta('risk-assessment-report').number,
      title: getSectionMeta('risk-assessment-report').title,
      blocks: buildSectionBlocks(
        insights['risk-assessment-report'],
        'Risk Assessment Evidence',
        [
          {
            type: 'bullets',
            items: [
              `Risk posture: ${metrics.risk.riskPosture}`,
              `High-risk sources: ${metrics.risk.riskSources.toLocaleString()} | High-risk flows: ${metrics.communication.highRiskFlows.toLocaleString()} | High-risk flow events: ${metrics.communication.highRiskFlowEvents.toLocaleString()}`,
              `Incident exposure: ${metrics.incidents.totalIncidentCount.toLocaleString()} total, ${metrics.incidents.openIncidentCount.toLocaleString()} open`,
              `Boundary signals: ${metrics.risk.externalOriginEvents.toLocaleString()} external-origin and ${metrics.risk.unknownClientEvents.toLocaleString()} unknown-host security events`,
              `Visibility confidence note: ${metrics.coverage.visibilityGapSummary}`,
              `Protection priorities: close incident backlog, complete device mapping, and improve monitoring depth where confidence remains partial.`,
            ],
          },
        ],
        metrics.narratives.riskAssessmentReport,
        `Protection priorities for this period: close ${metrics.incidents.openIncidentCount.toLocaleString()} open incidents, complete mapping for ${metrics.devices.unknownDevices.toLocaleString()} unmapped devices, and tighten boundary controls where external exposure was observed.`,
      ),
    },
    {
      number: getSectionMeta('conclusion-and-next-steps').number,
      title: getSectionMeta('conclusion-and-next-steps').title,
      blocks: buildSectionBlocks(
        insights['conclusion-and-next-steps'],
        'Final Position',
        [
          {
            type: 'bullets',
            items: [
              `Overall risk posture: ${metrics.risk.riskPosture}`,
              `Monitoring coverage: ${metrics.coverage.monitoringCoverageStatus}`,
              `Detection readiness: ${metrics.detection.readiness}`,
              `Production readiness: ${metrics.coverage.productionReadiness}`,
              `Observed high-risk concentration: ${metrics.risk.riskSources.toLocaleString()} risk sources and ${metrics.communication.highRiskFlows.toLocaleString()} high-risk flows`,
            ],
          },
        ],
        metrics.narratives.conclusion,
        '',
      ),
    },
  ];

  return {
    cover: {
      reportLabel: data.config.type === 'weekly' ? 'WEEKLY REPORT' : 'MONTHLY REPORT',
      title: REPORT_TITLE,
      clientName: data.config.clientName,
      periodLabel: `${formatReportDate(data.config.startDate, 'MMM dd, yyyy')} — ${formatReportDate(data.config.endDate, 'MMM dd, yyyy')}`,
      providerLabel: `Prepared by ${REPORT_PROVIDER}`,
      confidentialityNotice: CONFIDENTIALITY_NOTICE,
    },
    sections,
  };
}

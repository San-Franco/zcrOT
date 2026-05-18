import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import ReportTable from '../shared/report-table';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';
import { limitNarrativeText } from '../../utils/layout-utils';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

type WeaknessItem = {
  title: string;
  explanation: string;
  evidence: string;
};

function buildWeaknessItems(metrics: ReportMetrics): WeaknessItem[] {
  const items: WeaknessItem[] = [];

  if (metrics.coverage.monitoringCoverageStatus !== 'Strong' || metrics.otAssets.staleOrMissingUnitCount > 0) {
    items.push({
      title: 'Visibility depth is still partial',
      explanation: 'Current monitoring provides useful visibility into observed OT communication, but depth is not yet complete across all OT assets.',
      evidence: `${metrics.otAssets.otAssetCount.toLocaleString()} OT assets observed with ${metrics.otAssets.staleOrMissingUnitCount.toLocaleString()} stale/missing/offline unit statuses.`,
    });
  }

  if (metrics.devices.unknownDevices > 0) {
    items.push({
      title: 'Device identification is incomplete',
      explanation: 'A portion of observed devices remains unmapped, which reduces confidence when interpreting alerts and communication relationships.',
      evidence: `${metrics.devices.unknownDevices.toLocaleString()} observed devices are still unmapped in this period.`,
    });
  }

  if (metrics.risk.externalOriginEvents > 0) {
    items.push({
      title: 'External exposure points are visible',
      explanation: 'Observed external-origin activity indicates boundary exposure that should be tightened and reviewed regularly.',
      evidence: `${metrics.risk.externalOriginEvents.toLocaleString()} external-origin security events were recorded.`,
    });
  }

  if (metrics.communication.primaryParticipant !== 'No participant observed' && metrics.communication.communicationPaths > 0) {
    items.push({
      title: 'Communication is concentrated around key control points',
      explanation: 'When communication is concentrated through a small number of central participants, disruption or misuse at those points can have wider impact.',
      evidence: `Primary communication concentration was observed around ${metrics.communication.primaryParticipant}.`,
    });
  }

  if (metrics.incidents.openIncidentCount > 0) {
    items.push({
      title: 'Incident follow-up backlog remains',
      explanation: 'Open incidents indicate that some detected issues still require closure and verification before confidence can be raised.',
      evidence: `${metrics.incidents.openIncidentCount.toLocaleString()} open incidents out of ${metrics.incidents.totalIncidentCount.toLocaleString()} total incidents.`,
    });
  }

  if (metrics.detection.lowFeasibilityCount > 0 && items.length < 5) {
    items.push({
      title: 'Some monitoring blind spots still limit certainty',
      explanation: 'Certain security questions remain difficult to confirm with current telemetry depth, especially around command source and full downstream behavior.',
      evidence: `${metrics.detection.lowFeasibilityCount.toLocaleString()} low-feasibility detection objectives remain.`,
    });
  }

  if (items.length < 3) {
    items.push({
      title: 'Monitoring boundary still constrains confidence',
      explanation: 'The current risk view is useful for visible traffic and events, but it should be read as partial coverage rather than complete certainty.',
      evidence: metrics.coverage.visibilityGapSummary,
    });
  }

  return items.slice(0, 4);
}

function buildImplicationItems(metrics: ReportMetrics): string[] {
  const items: string[] = [];

  if (metrics.devices.unknownDevices > 0) {
    items.push('Alert triage and root-cause analysis can take longer when device ownership and function are not fully mapped.');
  }
  if (metrics.risk.externalOriginEvents > 0) {
    items.push('Boundary exposure can increase the chance of unauthorized or unsafe interaction reaching OT communication paths.');
  }
  if (metrics.incidents.openIncidentCount > 0) {
    items.push('Unresolved incidents can allow repeated risk patterns to persist without timely containment.');
  }
  if (metrics.coverage.monitoringCoverageStatus !== 'Strong' || metrics.otAssets.staleOrMissingUnitCount > 0) {
    items.push('Operational issues can be harder to confirm quickly when monitoring continuity is partial.');
  }
  if (metrics.detection.lowFeasibilityCount > 0) {
    items.push('Some high-impact behaviors may remain difficult to verify with confidence until visibility depth is expanded.');
  }

  if (items.length === 0) {
    items.push('No major downstream implication was elevated by deterministic checks in this period, but ongoing monthly validation remains important.');
  }

  return items.slice(0, 3);
}

function buildProtectionPrioritySummary(metrics: ReportMetrics): string {
  const topPriorities: string[] = [];
  if (metrics.incidents.openIncidentCount > 0) {
    topPriorities.push('close open incident follow-up and tighten triage workflow');
  }
  if (metrics.devices.unknownDevices > 0) {
    topPriorities.push('complete device mapping for clearer attribution');
  }
  if (metrics.risk.externalOriginEvents > 0) {
    topPriorities.push('tighten external exposure controls');
  }
  if (metrics.coverage.monitoringCoverageStatus !== 'Strong' || metrics.detection.lowFeasibilityCount > 0) {
    topPriorities.push('expand monitoring depth where confidence is still limited');
  }

  return [
    `For this reporting period, the environment sits in a ${metrics.risk.riskPosture.toLowerCase()} observed risk posture with ${metrics.coverage.monitoringCoverageStatus.toLowerCase()} monitoring coverage.`,
    topPriorities.length > 0
      ? `Immediate attention should focus on: ${topPriorities.slice(0, 3).join(', ')}.`
      : 'Immediate attention should focus on maintaining current controls and sustaining monthly validation discipline.',
    'These priorities are intended to reduce current weakness quickly while improving production confidence.',
  ].join(' ');
}

function compactTableText(text: string, maxChars = 180): string {
  return limitNarrativeText(text, { maxChars, maxSentences: 2 });
}

export default function RiskAssessmentReport({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'risk-assessment-report')!;
  const overviewText = limitNarrativeText(insight?.summary || metrics.narratives.riskAssessmentReport, {
    maxChars: 560,
    maxSentences: 2,
  });
  const protectionPrioritySummary = limitNarrativeText(
    insight?.suggestion || buildProtectionPrioritySummary(metrics),
    {
      maxChars: 420,
      maxSentences: 2,
    },
  );
  const weaknessItems = buildWeaknessItems(metrics);
  const implicationItems = buildImplicationItems(metrics);
  const weaknessRows = weaknessItems.map((item) => ({
    weakness: item.title,
    why_it_matters: compactTableText(item.explanation, 180),
    evidence: compactTableText(item.evidence, 130),
  }));

  const kpis: ReportKpiItem[] = [
    {
      label: 'High-Risk Sources',
      value: String(metrics.risk.riskSources),
      subtext: 'Distinct communication sources linked to elevated risk',
      tone: metrics.risk.riskSources === 0 ? 'good' : metrics.risk.riskSources <= 3 ? 'warning' : 'danger',
    },
    {
      label: 'High-Risk Flow Events',
      value: String(metrics.communication.highRiskFlowEvents),
      subtext: `${metrics.communication.highRiskFlows.toLocaleString()} elevated-risk communication paths`,
      tone: metrics.communication.highRiskFlowEvents === 0 ? 'good' : metrics.communication.highRiskFlowEvents <= 20 ? 'warning' : 'danger',
    },
    {
      label: 'Likely Attack Events',
      value: String(metrics.risk.likelyAttackEvents),
      subtext: 'Events classified as likely attack in selected period',
      tone: metrics.risk.likelyAttackEvents === 0 ? 'good' : metrics.risk.likelyAttackEvents <= 3 ? 'warning' : 'danger',
    },
    {
      label: 'Incident Exposure',
      value: `${metrics.incidents.openIncidentCount} / ${metrics.incidents.totalIncidentCount}`,
      subtext: 'Open / Total incidents in period',
      tone: metrics.incidents.openIncidentCount === 0 ? 'good' : 'warning',
    },
  ];

  const topIncidentGroupsData = metrics.incidents.topIncidentGroups.map((group) => ({
    group_key: compactTableText(group.groupKey, 120),
    incident_count: group.incidentCount.toLocaleString(),
    open_count: group.openIncidentCount.toLocaleString(),
    event_count: group.eventCount.toLocaleString(),
    max_severity: group.maxSeverity.toUpperCase(),
  }));

  return (
    <>
      <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
        <KpiGrid items={kpis} />

      <div className="report-asset-summary avoid-break">
        <h3 className="report-panel-title">Risk Overview</h3>
        <p className="report-summary-text">{overviewText}</p>
      </div>

      <div className="report-monitoring-context avoid-break">
        <h3 className="report-panel-title">Protection Priorities</h3>
        <p className="report-context-text">{protectionPrioritySummary}</p>
      </div>

      <div className="report-evidence-block avoid-break">
        <h3 className="report-panel-title">Key Weaknesses Identified</h3>
        <ReportTable
          columns={[
            { key: 'weakness', label: 'Weakness', width: '28%' },
            { key: 'why_it_matters', label: 'Why It Matters', width: '40%' },
            { key: 'evidence', label: 'Evidence Signal', width: '32%' },
          ]}
          data={weaknessRows as unknown as Record<string, unknown>[]}
          maxRows={4}
          caption="Plain-Language Weakness Summary"
        />
      </div>

      <div className="report-evidence-block avoid-break">
        <h3 className="report-panel-title">What These Weaknesses Could Lead To</h3>
        <ul className="report-highlight-list">
          {implicationItems.map((item, index) => (
            <li key={`${item}-${index}`}>• {item}</li>
          ))}
        </ul>
      </div>
      </SectionWrapper>

      <SectionWrapper
        section={section}
        idSuffix="evidence-details"
        titleOverride="Risk Assessment (Evidence Details)"
        insight={undefined}
        evidenceTitle={null}
      >
        <div className="report-evidence-block avoid-break" style={{ marginBottom: '56px' }}>
          <h3 className="report-panel-title">Supporting Exposure Evidence</h3>
          <table className="report-key-value-table report-compact-table">
            <tbody>
              <tr>
                <td>Security Events From External Origin</td>
                <td>{metrics.risk.externalOriginEvents.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Observed OT Assets (unit_id)</td>
                <td>{metrics.otAssets.otAssetCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Unknown-Identity Security Events</td>
                <td>{metrics.risk.unknownClientEvents.toLocaleString()}</td>
              </tr>
              <tr>
                <td>High Severity Security Events</td>
                <td>{metrics.risk.highSeverityEvents.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Unknown-Direction Paths</td>
                <td>{metrics.communication.unknownDirectionPaths.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Control Reliability Summary</td>
                <td>{compactTableText(metrics.communication.controlReliabilitySummary, 160)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="report-evidence-block avoid-break" style={{ marginBottom: '56px' }}>
          <h3 className="report-panel-title">Visibility Limits Affecting Confidence</h3>
          <table className="report-key-value-table report-compact-table">
            <tbody>
              <tr>
                <td>Monitoring Coverage Status</td>
                <td>{metrics.coverage.monitoringCoverageStatus}</td>
              </tr>
              <tr>
                <td>Coverage Summary</td>
                <td>{compactTableText(metrics.coverage.monitoringCoverageSummary, 150)}</td>
              </tr>
              <tr>
                <td>Visibility Gap Summary</td>
                <td>{compactTableText(metrics.coverage.visibilityGapSummary, 150)}</td>
              </tr>
              <tr>
                <td>Production Readiness Context</td>
                <td>{metrics.coverage.productionReadiness}</td>
              </tr>
            </tbody>
          </table>
        </div>

      <ReportTable
        columns={[
          { key: 'group_key', label: 'Incident Pattern', width: '42%' },
          { key: 'incident_count', label: 'Incidents', align: 'center', width: '14%' },
          { key: 'open_count', label: 'Open', align: 'center', width: '12%' },
          { key: 'event_count', label: 'Related Events', align: 'center', width: '16%' },
          { key: 'max_severity', label: 'Max Severity', align: 'center', width: '14%' },
        ]}
        data={topIncidentGroupsData as unknown as Record<string, unknown>[]}
        maxRows={5}
        caption="Observed Incident Patterns (Top 5)"
      />
      </SectionWrapper>
    </>
  );
}

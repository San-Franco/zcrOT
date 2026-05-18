import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

export default function ConclusionAndNextSteps({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'conclusion-and-next-steps')!;
  const summaryText = insight?.summary || metrics.narratives.conclusion;

  const kpis: ReportKpiItem[] = [
    {
      label: 'Overall Risk Posture',
      value: metrics.risk.riskPosture,
      subtext: `${metrics.risk.riskSources.toLocaleString()} high-risk source IPs observed`,
      tone: metrics.risk.riskPosture === 'High' ? 'danger' : metrics.risk.riskPosture === 'Medium' ? 'warning' : 'good',
    },
    {
      label: 'Monitoring Coverage',
      value: metrics.coverage.monitoringCoverageStatus,
      subtext: `${metrics.devices.observedAssets.toLocaleString()} observed assets, ${metrics.communication.communicationPaths.toLocaleString()} paths`,
      tone: metrics.coverage.monitoringCoverageStatus === 'Strong' ? 'good' : metrics.coverage.monitoringCoverageStatus === 'Partial' ? 'warning' : 'danger',
    },
    {
      label: 'Control Stability',
      value: metrics.communication.controlStability,
      subtext: `${metrics.communication.modbusSuccessRate}% Modbus success rate`,
      tone: metrics.communication.controlStability === 'Stable'
        ? 'good'
        : metrics.communication.controlStability === 'Watch'
          ? 'warning'
          : 'danger',
    },
    {
      label: 'Detection Readiness',
      value: metrics.detection.readiness,
      subtext: `${metrics.detection.highFeasibilityCount} high / ${metrics.detection.partialFeasibilityCount} partial / ${metrics.detection.lowFeasibilityCount} low`,
      tone: metrics.detection.readiness === 'Strong' ? 'good' : metrics.detection.readiness === 'Moderate' ? 'warning' : 'danger',
    },
  ];

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <div className="report-asset-summary avoid-break">
        <h3 className="report-panel-title">Period Closing Summary</h3>
        <p className="report-summary-text">{summaryText}</p>
      </div>

      <KpiGrid items={kpis} />

      <div className="report-evidence-block avoid-break" style={{ marginTop: '32px', borderTop: '2px solid #e2e8f0', paddingTop: '16px', textAlign: 'center' }}>
        <h3 className="report-panel-title" style={{ color: '#64748b', letterSpacing: '0.05em', marginBottom: '16px', textAlign: 'center' }}>CONFIDENTIALITY & SCOPE LIMITATIONS</h3>

        <p className="report-context-text" style={{ fontSize: '8pt', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
          <strong style={{ color: '#475569' }}>Strictly Confidential</strong><br />
          This report contains sensitive OT monitoring findings, security observations, and operational visibility details. It is intended only for authorized recipients. Unauthorized distribution, reproduction, or external sharing is strictly prohibited.
        </p>
        
        <p className="report-context-text" style={{ fontSize: '8pt', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
          <strong style={{ color: '#475569' }}>Reporting Period Context</strong><br />
          The findings, incident counts, risk indicators, and conclusions in this report apply only to the selected reporting period and are based on the telemetry successfully collected during that window. OT and network environments can change over time, so these results should be read as a time-bound operational snapshot rather than a permanent condition.
        </p>
        
        <p className="report-context-text" style={{ fontSize: '8pt', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
          <strong style={{ color: '#475569' }}>Monitoring Scope & Visibility Boundaries</strong><br />
          This assessment is based on passive monitoring and the visibility available from the current collection points. It reflects only the assets, communications, and events that were observable within the monitored scope during the selected period. Activity occurring outside monitored segments, behind unobserved communication paths, or through channels not visible to the deployed sensors is outside the scope of this report.
        </p>
        
        <p className="report-context-text" style={{ fontSize: '8pt', color: '#64748b', lineHeight: '1.5', marginBottom: '8px' }}>
          <strong style={{ color: '#475569' }}>Interpretation of Results</strong><br />
          The absence of observed activity in this report should not be interpreted as confirmation that no risk exists. It indicates only that such activity was not visible within the monitoring coverage available during the reporting period. This report is intended to support visibility, risk understanding, and improvement planning based on observed evidence.
        </p>
        
        <p className="report-context-text" style={{ fontSize: '8pt', color: '#64748b', fontStyle: 'italic', marginTop: '16px' }}>
          For further clarification regarding the findings in this report, please contact the project owner or designated technical contact.
        </p>
      </div>
    </SectionWrapper>
  );
}

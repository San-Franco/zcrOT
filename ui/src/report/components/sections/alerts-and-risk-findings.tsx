import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import ReportTable from '../shared/report-table';
import { REPORT_COLORS, REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

export default function AlertsAndRiskFindings({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'alerts-and-risk-findings')!;
  const riskAssessmentText = insight?.summary || metrics.narratives.risk;

  const kpis: ReportKpiItem[] = [
    {
      label: 'Security Events',
      value: String(metrics.risk.totalSecurityEvents),
      subtext: 'All severity levels observed in this period',
      tone: metrics.risk.totalSecurityEvents === 0 ? 'good' : metrics.risk.totalSecurityEvents <= 20 ? 'warning' : 'danger',
    },
    {
      label: 'High Severity Events',
      value: String(metrics.risk.highSeverityEvents),
      subtext: 'High + Critical severity events',
      tone: metrics.risk.highSeverityEvents === 0 ? 'good' : metrics.risk.highSeverityEvents <= 5 ? 'warning' : 'danger',
    },
    {
      label: 'Likely Attack Events',
      value: String(metrics.risk.likelyAttackEvents),
      subtext: 'Security verdict = likely_attack',
      tone: metrics.risk.likelyAttackEvents === 0 ? 'good' : metrics.risk.likelyAttackEvents <= 3 ? 'warning' : 'danger',
    },
    {
      label: 'Detection Incidents',
      value: String(metrics.incidents.totalIncidentCount),
      subtext: `${metrics.incidents.openIncidentCount} open incidents in selected period`,
      tone: metrics.incidents.totalIncidentCount === 0 ? 'good' : metrics.incidents.openIncidentCount > 0 ? 'warning' : 'neutral',
    },
  ];

  const severityChart = [
    { name: 'Low', value: metrics.risk.severity.low, fill: REPORT_COLORS.severity.low },
    { name: 'Medium', value: metrics.risk.severity.medium, fill: REPORT_COLORS.severity.medium },
    { name: 'High', value: metrics.risk.severity.high, fill: REPORT_COLORS.severity.high },
    { name: 'Critical', value: metrics.risk.severity.critical, fill: REPORT_COLORS.severity.critical },
  ].filter((item) => item.value > 0);

  const topRiskSourcesData = metrics.risk.topRiskSources.slice(0, 5).map((row) => ({
    source: row.sourceIp,
    event_count: row.eventCount.toLocaleString(),
    max_risk: row.maxRiskScore.toFixed(1),
    avg_risk: row.avgRiskScore.toFixed(1),
  }));

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <div className="report-asset-summary avoid-break">
        <h3 className="report-panel-title">Risk Assessment</h3>
        <p className="report-summary-text">{riskAssessmentText}</p>
      </div>



      <KpiGrid items={kpis} />

      <div className="report-evidence-block avoid-break">
        <h4 className="report-evidence-title">Severity And Verdict Distribution</h4>

        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-start' }}>
          {severityChart.length > 0 && (
            <div style={{ flex: '0 0 45%', height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    style={{ fontSize: '7pt' }}
                  >
                    {severityChart.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ flex: '1', minWidth: 0 }}>
            <table className="report-compact-table" style={{ marginTop: 0 }}>
              <tbody>
                <tr>
                  <td>Likely Legitimate</td>
                  <td>{metrics.risk.verdict.likelyLegitimate.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Likely Legitimate (Unknown IP)</td>
                  <td>{metrics.risk.verdict.likelyLegitimateUnknownIp.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Under Investigation</td>
                  <td>{metrics.risk.verdict.underInvestigation.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Likely Attack</td>
                  <td>{metrics.risk.verdict.likelyAttack.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="report-evidence-block avoid-break">
        <h4 className="report-evidence-title">Exposure Signals</h4>
        <table className="report-compact-table" style={{ marginTop: 0 }}>
          <tbody>
            <tr>
              <td>Unknown-Host Security Events</td>
              <td>{metrics.risk.unknownClientEvents.toLocaleString()}</td>
            </tr>
            <tr>
              <td>External-Origin Security Events</td>
              <td>{metrics.risk.externalOriginEvents.toLocaleString()}</td>
            </tr>
            <tr>
              <td>High-Risk Source IPs</td>
              <td>{metrics.risk.riskSources.toLocaleString()}</td>
            </tr>
            <tr>
              <td>High-Risk Communication Flows</td>
              <td>{metrics.communication.highRiskFlows.toLocaleString()}</td>
            </tr>
            <tr>
              <td>High-Risk Flow Events</td>
              <td>{metrics.communication.highRiskFlowEvents.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Maximum Observed Risk Score</td>
              <td>{metrics.risk.maxRiskScore.toFixed(1)}</td>
            </tr>
            <tr>
              <td>Average Top-Source Risk Score</td>
              <td>{metrics.risk.avgRiskScore.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ReportTable
        columns={[
          { key: 'source', label: 'Source IP', width: '32%' },
          { key: 'event_count', label: 'Event Count', align: 'center', width: '18%' },
          { key: 'max_risk', label: 'Max Risk Score', align: 'center', width: '20%' },
          { key: 'avg_risk', label: 'Avg Risk Score', align: 'center', width: '20%' },
        ]}
        data={topRiskSourcesData as unknown as Record<string, unknown>[]}
        maxRows={5}
        caption="Top Risk Sources"
      />

      {metrics.risk.topRiskSources.length > 5 && (
        <div className="report-footnote" style={{ marginTop: '0.3rem', fontSize: '7pt' }}>
          Showing top 5 of {metrics.risk.topRiskSources.length.toLocaleString()} observed risk sources.
        </div>
      )}
    </SectionWrapper>
  );
}

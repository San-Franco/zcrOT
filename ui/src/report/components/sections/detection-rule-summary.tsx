import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import ReportTable from '../shared/report-table';
import { REPORT_COLORS, REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';
import { limitNarrativeText } from '../../utils/layout-utils';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

export default function DetectionRuleSummary({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'detection-rule-summary')!;
  const summaryText = limitNarrativeText(insight?.summary || metrics.narratives.detection, {
    maxChars: 560,
    maxSentences: 2,
  });
  const recommendationText = limitNarrativeText(insight?.suggestion, {
    maxChars: 320,
    maxSentences: 2,
  });

  const kpis: ReportKpiItem[] = [
    {
      label: 'Detection Rules (Default / Custom)',
      value: `${metrics.detection.defaultRuleCount} / ${metrics.detection.customRuleCount}`,
      subtext: 'Default / Custom rules in reporting scope',
      tone: metrics.detection.totalRuleCount > 0 ? 'good' : 'danger',
    },
    {
      label: 'Detection Readiness',
      value: metrics.detection.readiness,
      subtext: `${metrics.detection.signalCategoryCount} of 5 signal categories observed`,
      tone: metrics.detection.readiness === 'Strong' ? 'good' : metrics.detection.readiness === 'Moderate' ? 'warning' : 'danger',
    },
    {
      label: 'Signal-Backed Detection',
      value: String(metrics.detection.signalCategoryCount),
      subtext: `${metrics.risk.likelyAttackEvents} likely-attack and ${metrics.risk.unknownClientEvents} unknown-host signals`,
      tone: metrics.detection.signalCategoryCount >= 4 ? 'good' : metrics.detection.signalCategoryCount >= 2 ? 'warning' : 'danger',
    },
    {
      label: 'Feasibility Split',
      value: `${metrics.detection.highFeasibilityCount}/${metrics.detection.partialFeasibilityCount}/${metrics.detection.lowFeasibilityCount}`,
      subtext: 'High / Partial / Low objectives',
      tone: metrics.detection.lowFeasibilityCount === 0 ? 'good' : metrics.detection.lowFeasibilityCount <= 1 ? 'warning' : 'danger',
    },
  ];

  const signalChartData = [
    { signal: 'Unknown Client', count: metrics.detection.signals.unknownClient },
    { signal: 'Outside Hours', count: metrics.detection.signals.outsideHours },
    { signal: 'Likely Attack', count: metrics.detection.signals.likelyAttack },
    { signal: 'Modbus Disrupted', count: metrics.detection.signals.modbusDisrupted },
    { signal: 'External Origin', count: metrics.detection.signals.externalOrigin },
  ].filter((item) => item.count > 0);

  const feasibilityRows = metrics.detection.feasibilityRows.map((row) => ({
    detectionType: row.detectionType,
    feasibility: row.feasibility,
    evidenceBasis: row.evidenceBasis,
    limitationNote: row.limitationNote,
  }));

  return (
    <>
      <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
        <div className="report-asset-summary avoid-break">
          <h3 className="report-panel-title">Detection Readiness Summary</h3>
          <p className="report-summary-text">{summaryText}</p>
        </div>

        <KpiGrid items={kpis} />

        <div className="report-evidence-block avoid-break">
          <h3 className="report-panel-title">Rule Inventory Snapshot</h3>
          <table className="report-key-value-table report-compact-table">
            <tbody>
              <tr>
                <td>Platform Default Rules</td>
                <td>{metrics.detection.defaultRuleCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Custom Rules</td>
                <td>{metrics.detection.customRuleCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Total Rules (Default + Custom)</td>
                <td>{metrics.detection.totalRuleCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Custom Rules Active / Inactive</td>
                <td>
                  {metrics.detection.activeRuleCount.toLocaleString()} /
                  {' '}{metrics.detection.inactiveRuleCount.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td>In-Period Incidents</td>
                <td>{metrics.incidents.totalIncidentCount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ReportTable
          columns={[
            { key: 'detectionType', label: 'Detection Objective', width: '26%' },
            { key: 'feasibility', label: 'Feasibility', align: 'center', width: '12%' },
            { key: 'evidenceBasis', label: 'Evidence Basis', width: '34%' },
            { key: 'limitationNote', label: 'Limitation', width: '28%' },
          ]}
          data={feasibilityRows as unknown as Record<string, unknown>[]}
          maxRows={6}
          caption="Detection Feasibility Matrix"
        />
      </SectionWrapper>

      <SectionWrapper
        section={section}
        idSuffix="continued-1"
        titleOverride="Detection Readiness (Continued)"
        insight={undefined}
        evidenceTitle={null}
      >
        {signalChartData.length > 0 ? (
          <div className="report-chart-col report-chart-col--wide" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 className="report-evidence-title">Observed Detection Signals</h4>
            <div style={{ flex: 1, width: '100%', minHeight: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="signal" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} width={25} />
                  <Tooltip />
                  <Bar dataKey="count" fill={REPORT_COLORS.primary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="report-footnote">No detection signals were observed in the selected period.</div>
        )}

        {recommendationText && (
          <div className="report-evidence-block avoid-break" style={{ flex: 'none' }}>
            <h3 className="report-panel-title">Detection Improvement Priority</h3>
            <p className="report-context-text">{recommendationText}</p>
          </div>
        )}
      </SectionWrapper>
    </>
  );
}

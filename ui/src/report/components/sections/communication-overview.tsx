import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

export default function CommunicationOverview({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'communication-overview') ?? REPORT_SECTIONS[0];
  const summaryText = insight?.summary || metrics.narratives.communication;

  const kpis: ReportKpiItem[] = [
    {
      label: 'Communication Paths',
      value: String(metrics.communication.communicationPaths),
      subtext: `${metrics.communication.flowEvents.toLocaleString()} flow events in selected period`,
      tone: metrics.communication.communicationPaths > 0 ? 'good' : 'warning',
    },
    {
      label: 'OT Units in Control Activity',
      value: String(metrics.communication.otUnitParticipationCount),
      subtext: `${metrics.communication.otUnitsWithErrors.toLocaleString()} with errors, ${metrics.communication.otUnitsWithSlowPolls.toLocaleString()} with slow polls`,
      tone: metrics.communication.otUnitParticipationCount === 0
        ? 'warning'
        : metrics.communication.otUnitsWithErrors === 0
          ? 'good'
          : metrics.communication.otUnitsWithErrors <= 2
            ? 'warning'
            : 'danger',
    },

    {
      label: 'Modbus Success Rate',
      value: `${metrics.communication.modbusSuccessRate}%`,
      subtext: `${metrics.communication.modbusErrors.toLocaleString()} errors from ${metrics.communication.modbusRequests.toLocaleString()} requests`,
      tone: metrics.communication.modbusSuccessRate >= 98 ? 'good' : metrics.communication.modbusSuccessRate >= 90 ? 'warning' : 'danger',
    },
    {
      label: 'High-Risk Flows',
      value: String(metrics.communication.highRiskFlows),
      subtext: `${metrics.communication.riskSources.toLocaleString()} risk source IPs (max risk >= 70)`,
      tone: metrics.communication.highRiskFlows === 0 ? 'good' : metrics.communication.highRiskFlows <= 3 ? 'warning' : 'danger',
    },
  ];

  const notablePaths = metrics.communication.notablePaths.slice(0, 5).map((path) => ({
    source: path.sourceIp.length > 15 ? `${path.sourceIp.slice(0, 15)}..` : path.sourceIp || 'Unknown',
    destination: path.destinationIp.length > 15 ? `${path.destinationIp.slice(0, 15)}..` : path.destinationIp || 'Unknown',
    protocol: path.protocol || 'Unknown',
    port: path.port || '-',
    direction: (path.direction || 'Unknown').replaceAll('_', ' '),
    eventCount: path.eventCount.toLocaleString(),
    avgRisk: path.avgRiskScore.toFixed(1),
  }));

  const topOtControlUnits = metrics.communication.topOtControlUnits.slice(0, 5).map((row) => ({
    unit: `Unit ${row.unitId}`,
    label: row.unitLabel,
    requests: row.totalRequests.toLocaleString(),
    successRate: `${row.successRate}%`,
    errors: row.errorCount.toLocaleString(),
    slowPolls: row.slowCount.toLocaleString(),
    avgResponse: row.avgResponseTimeMs !== null ? row.avgResponseTimeMs.toFixed(1) : '—',
  }));

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <div className="report-comm-summary avoid-break">
        <h3 className="report-panel-title">Communication Summary</h3>
        <p className="report-summary-text">{summaryText}</p>
      </div>

      <KpiGrid items={kpis} />

      <div className="report-comm-evidence avoid-break">
        <div className="report-evidence-block">
          <h3 className="report-panel-title">Path Profile</h3>
          <table className="report-key-value-table report-compact-table">
            <tbody>
              <tr>
                <td>Primary Participant</td>
                <td>{metrics.communication.primaryParticipant}</td>
              </tr>

              <tr>
                <td>Unknown Direction Paths</td>
                <td>{metrics.communication.unknownDirectionPaths.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Outside-Hours Events</td>
                <td>{metrics.communication.outsideHoursEvents.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Unknown-Client Flow Events</td>
                <td>{metrics.communication.unknownClientEvents.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="report-evidence-block">
          <h3 className="report-panel-title">OT Control-Path Visibility</h3>
          <table className="report-key-value-table report-compact-table">
            <tbody>
              <tr>
                <td>OT Units with Control Activity</td>
                <td>{metrics.communication.otUnitParticipationCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Primary OT Control Participant</td>
                <td>{metrics.communication.primaryOtControlUnit}</td>
              </tr>
              <tr>
                <td>Units with Polling Errors</td>
                <td>{metrics.communication.otUnitsWithErrors.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Modbus Success Rate</td>
                <td>{metrics.communication.modbusSuccessRate}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="report-notable-paths avoid-break">
        <h3 className="report-panel-title">OT Unit Control Evidence</h3>
        <table className="report-key-value-table report-compact-table">
          <thead>
            <tr>
              <th style={{ width: '11%' }}>OT Unit</th>
              <th style={{ width: '24%' }}>Control Label</th>
              <th style={{ width: '12%' }}>Requests</th>
              <th style={{ width: '11%' }}>Success</th>
              <th style={{ width: '11%' }}>Errors</th>
              <th style={{ width: '11%' }}>Slow</th>
              <th style={{ width: '12%' }}>Avg ms</th>
            </tr>
          </thead>
          <tbody>
            {topOtControlUnits.length > 0 ? (
              topOtControlUnits.map((row, idx) => (
                <tr key={`${row.unit}-${idx}`}>
                  <td>{row.unit}</td>
                  <td>{row.label}</td>
                  <td>{row.requests}</td>
                  <td>{row.successRate}</td>
                  <td>{row.errors}</td>
                  <td>{row.slowPolls}</td>
                  <td>{row.avgResponse}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  No OT unit-level control evidence available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="report-table-footer">{metrics.communication.otControlSummary}</p>
      </div>

      <div className="report-notable-paths avoid-break">
        <h3 className="report-panel-title">Notable Communication Paths (Top 5)</h3>
        <table className="report-key-value-table report-compact-table">
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Source</th>
              <th style={{ width: '16%' }}>Destination</th>
              <th style={{ width: '10%' }}>Protocol</th>
              <th style={{ width: '8%' }}>Port</th>
              <th style={{ width: '14%' }}>Direction</th>
              <th style={{ width: '8%' }}>Events</th>
              <th style={{ width: '8%' }}>Avg Risk</th>
            </tr>
          </thead>
          <tbody>
            {notablePaths.length > 0 ? (
              notablePaths.map((row, idx) => (
                <tr key={`${row.source}-${row.destination}-${idx}`}>
                  <td>{row.source}</td>
                  <td>{row.destination}</td>
                  <td>{row.protocol}</td>
                  <td>{row.port}</td>
                  <td>{row.direction}</td>
                  <td>{row.eventCount}</td>
                  <td>{row.avgRisk}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="report-table-footer">
          Top 5 selected by deterministic risk relevance (risk score, likely-attack, unknown-client, outside-hours, then volume).
        </p>
      </div>
    </SectionWrapper>
  );
}

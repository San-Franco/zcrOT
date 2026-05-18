import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

interface ObservedConditionsData {
  observedPaths: number;
  topAssets: string[];
  modbusSuccessRate: number;
  modbusErrorCount: number;
  slowPollCount: number;
  securityEventCount: number;
  unknownClientEvents: number;
  likelyAttackEvents: number;
  externalOriginEvents: number;
  topRiskSources: string[];
}

export default function ExecutiveSummary({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'executive-summary')!;
  const summaryText = insight?.summary || metrics.narratives.executiveSummary;
  const observedConditions = generateObservedConditions(metrics);

  const kpis: ReportKpiItem[] = [
    {
      label: 'Observed Assets',
      value: String(metrics.devices.observedAssets),
      subtext: 'Distinct source/destination IPs seen in OT events',
      tone: metrics.devices.observedAssets > 0 ? 'good' : 'warning',
    },
    {
      label: 'Known Devices',
      value: String(metrics.devices.knownDevices),
      subtext: 'Active mapped IPs in device registry',
      tone: metrics.devices.knownDevices > 0 ? 'good' : 'warning',
    },
    {
      label: 'Unknown Devices',
      value: String(metrics.devices.unknownDevices),
      subtext: 'Observed IPs without active name mapping',
      tone: metrics.devices.unknownDevices === 0 ? 'good' : metrics.devices.unknownDevices <= 5 ? 'warning' : 'danger',
    },
    {
      label: 'Security Events',
      value: String(metrics.risk.totalSecurityEvents),
      subtext: `${metrics.risk.highSeverityEvents} high/critical events`,
      tone: metrics.risk.highSeverityEvents === 0 ? 'good' : metrics.risk.highSeverityEvents <= 5 ? 'warning' : 'danger',
    },
  ];

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <KpiGrid items={kpis} />

      <div className="report-observed-conditions avoid-break">
        <h3 className="report-panel-title">Observed Conditions</h3>
        <div className="report-conditions-grid">
          <div className="report-condition-block">
            <div className="report-condition-header">
              <h4 className="report-condition-title">Communication Activity</h4>
            </div>
            <div className="report-condition-metrics">
              <div className="report-condition-metric">
                <span className="report-condition-label">Communication Paths</span>
                <span className="report-condition-value">{observedConditions.observedPaths}</span>
              </div>
              {observedConditions.topAssets.length > 0 && (
                <div className="report-condition-metric">
                  <span className="report-condition-label">Top Assets</span>
                  <span className="report-condition-value-small">{observedConditions.topAssets.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="report-condition-block">
            <div className="report-condition-header">
              <h4 className="report-condition-title">Control Reliability</h4>
            </div>
            <div className="report-condition-metrics">
              <div className="report-condition-metric">
                <span className="report-condition-label">Success Rate</span>
                <span className="report-condition-value">{observedConditions.modbusSuccessRate}%</span>
              </div>
              <div className="report-condition-metric">
                <span className="report-condition-label">Errors</span>
                <span className="report-condition-value">{observedConditions.modbusErrorCount}</span>
              </div>
              <div className="report-condition-metric">
                <span className="report-condition-label">Slow Polls</span>
                <span className="report-condition-value">{observedConditions.slowPollCount}</span>
              </div>
            </div>
          </div>

          <div className="report-condition-block">
            <div className="report-condition-header">
              <h4 className="report-condition-title">Security Events</h4>
            </div>
            <div className="report-condition-metrics">
              <div className="report-condition-metric">
                <span className="report-condition-label">Total Events</span>
                <span className="report-condition-value">{observedConditions.securityEventCount.toLocaleString()}</span>
              </div>
              <div className="report-condition-metric">
                <span className="report-condition-label">Unknown Clients</span>
                <span className="report-condition-value">{observedConditions.unknownClientEvents.toLocaleString()}</span>
              </div>
              <div className="report-condition-metric">
                <span className="report-condition-label">Attack Events</span>
                <span className="report-condition-value">{observedConditions.likelyAttackEvents.toLocaleString()}</span>
              </div>
              <div className="report-condition-metric">
                <span className="report-condition-label">External Origin</span>
                <span className="report-condition-value">{observedConditions.externalOriginEvents.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="report-condition-block">
            <div className="report-condition-header">
              <h4 className="report-condition-title">Top Risk Sources</h4>
            </div>
            <div className="report-condition-metrics">
              <div className="report-condition-metric">
                <span className="report-condition-label">Highest Risk</span>
                <span className="report-condition-value-small">{observedConditions.topRiskSources.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="report-evidence-block avoid-break">
        <h3 className="report-panel-title">Period Snapshot</h3>
        <table className="report-key-value-table report-compact-table">
          <tbody>
            <tr>
              <td>Reporting Window</td>
              <td>{metrics.dateRange.periodLabel}</td>
            </tr>
            <tr>
              <td>Communication Paths</td>
              <td>{metrics.communication.communicationPaths.toLocaleString()}</td>
            </tr>
            <tr>
              <td>External Paths</td>
              <td>{metrics.communication.externalPaths.toLocaleString()}</td>
            </tr>
            <tr>
              <td>High-Risk Flows (Max Risk &gt;= 70)</td>
              <td>{metrics.communication.highRiskFlows.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Likely Attack Events</td>
              <td>{metrics.risk.likelyAttackEvents.toLocaleString()}</td>
            </tr>
            <tr>
              <td>External-Origin Events</td>
              <td>{metrics.risk.externalOriginEvents.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Modbus Operation Success</td>
              <td>{metrics.communication.modbusSuccessRate}%</td>
            </tr>
            <tr>
              <td>Overall Risk Posture</td>
              <td>{metrics.risk.riskPosture}</td>
            </tr>
            <tr>
              <td>Total Detection Incidents</td>
              <td>{metrics.incidents.totalIncidentCount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Detection Rules (Default / Custom)</td>
              <td>{metrics.detection.defaultRuleCount.toLocaleString()} / {metrics.detection.customRuleCount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="report-monitoring-context avoid-break">
        <h3 className="report-panel-title">Period Summary</h3>
        <p className="report-context-text">{summaryText}</p>
      </div>
    </SectionWrapper>
  );
}

function generateObservedConditions(metrics: ReportMetrics): ObservedConditionsData {
  const participantCounts = new Map<string, number>();

  for (const path of metrics.communication.notablePaths) {
    const source = path.sourceIp?.trim();
    const destination = path.destinationIp?.trim();

    if (source && !source.toLowerCase().includes('unknown')) {
      participantCounts.set(source, (participantCounts.get(source) ?? 0) + path.eventCount);
    }
    if (destination && !destination.toLowerCase().includes('unknown')) {
      participantCounts.set(destination, (participantCounts.get(destination) ?? 0) + path.eventCount);
    }
  }

  return {
    observedPaths: metrics.communication.communicationPaths,
    topAssets: Array.from(participantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([asset]) => asset),
    modbusSuccessRate: metrics.communication.modbusSuccessRate,
    modbusErrorCount: metrics.communication.modbusErrors,
    slowPollCount: metrics.communication.modbusSlowPolls,
    securityEventCount: metrics.risk.totalSecurityEvents,
    unknownClientEvents: metrics.risk.unknownClientEvents,
    likelyAttackEvents: metrics.risk.likelyAttackEvents,
    externalOriginEvents: metrics.risk.externalOriginEvents,
    topRiskSources: metrics.risk.topRiskSources.slice(0, 3).map((row) => row.sourceIp),
  };
}

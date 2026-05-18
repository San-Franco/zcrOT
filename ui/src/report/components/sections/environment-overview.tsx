import SectionWrapper from '../shared/section-wrapper';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportMetrics } from '../../types';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

export default function EnvironmentOverview({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'environment-overview') ?? REPORT_SECTIONS[0];
  const summaryText = insight?.summary || metrics.narratives.environmentOverview;
  const topProtocols = metrics.communication.protocolBreakdown
    .slice(0, 3)
    .map((item) => `${item.protocol} (${item.events.toLocaleString()})`)
    .join(', ');
  const visibilityGaps = metrics.coverage.visibilityGaps.slice(0, 2).join(' ');

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <div className="report-monitoring-context avoid-break">
        <h3 className="report-panel-title">Monitoring Context</h3>
        <p className="report-context-text">{summaryText}</p>
      </div>

      <div className="report-scope-coverage avoid-break">
        <h3 className="report-panel-title">Monitoring Scope & Coverage</h3>
        <table className="report-key-value-table report-expanded-table">
          <tbody>
            <tr>
              <td>Reporting Window</td>
              <td>{metrics.dateRange.periodLabel}</td>
            </tr>
            <tr>
              <td>Monitoring Coverage</td>
              <td>{metrics.coverage.monitoringCoverageStatus}</td>
            </tr>
            <tr>
              <td>Coverage Summary</td>
              <td>{metrics.coverage.monitoringCoverageSummary}</td>
            </tr>
            <tr>
              <td>Production Readiness</td>
              <td>{metrics.coverage.productionReadiness}</td>
            </tr>
            <tr>
              <td>Observed OT Assets</td>
              <td>{metrics.otAssets.otAssetCount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Stale/Missing OT Units</td>
              <td>{metrics.otAssets.staleOrMissingUnitCount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Known / Unknown Devices</td>
              <td>{metrics.devices.knownDevices.toLocaleString()} / {metrics.devices.unknownDevices.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Communication Paths</td>
              <td>{metrics.communication.communicationPaths.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Top Protocols</td>
              <td>{topProtocols || 'No protocol data available'}</td>
            </tr>
            <tr>
              <td>Observed Visibility Gaps</td>
              <td>{visibilityGaps || metrics.coverage.visibilityGapSummary}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

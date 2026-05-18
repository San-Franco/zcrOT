import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import { REPORT_SECTIONS } from '../../constants';
import type { AiInsight, ReportKpiItem, ReportMetrics } from '../../types';
import { limitNarrativeText } from '../../utils/layout-utils';

interface Props {
  metrics: ReportMetrics;
  insight?: AiInsight;
}

function formatLastSeen(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || 'No data';
  }

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AssetVisibilitySummary({ metrics, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'asset-visibility-summary') ?? REPORT_SECTIONS[0];
  const summaryText = limitNarrativeText(insight?.summary || metrics.narratives.assetVisibility, {
    maxChars: 500,
    maxSentences: 2,
  });
  const otAssetRows = metrics.otAssets.otAssets;

  const kpis: ReportKpiItem[] = [
    {
      label: 'OT Assets',
      value: String(metrics.otAssets.otAssetCount),
      subtext: 'Distinct OT unit_id assets observed in selected period',
      tone: metrics.otAssets.otAssetCount > 0 ? 'good' : 'warning',
    },
    {
      label: 'Known / Unknown Devices',
      value: `${metrics.devices.knownDevices.toLocaleString()} / ${metrics.devices.unknownDevices.toLocaleString()}`,
      subtext: 'Mapped IPs vs observed unmapped IPs',
      tone: metrics.devices.unknownDevices === 0 ? 'good' : metrics.devices.unknownDevices <= 5 ? 'warning' : 'danger',
    },
    {
      label: 'Observed IP Assets',
      value: String(metrics.devices.observedAssets),
      subtext: 'Distinct source/destination IPs observed in event flows',
      tone: metrics.devices.observedAssets > 0 ? 'good' : 'warning',
    },
    {
      label: 'OT Unit Continuity',
      value: `${metrics.otAssets.reportingUnitCount.toLocaleString()} / ${metrics.otAssets.otAssetCount.toLocaleString()}`,
      subtext: `${metrics.otAssets.staleOrMissingUnitCount.toLocaleString()} stale/missing/offline unit statuses`,
      tone: metrics.otAssets.staleOrMissingUnitCount === 0 ? 'good' : metrics.otAssets.staleOrMissingUnitCount <= 2 ? 'warning' : 'danger',
    },
  ];

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      <div className="report-asset-summary avoid-break">
        <h3 className="report-panel-title">OT Asset Visibility Summary</h3>
        <p className="report-summary-text">{summaryText}</p>
      </div>

      <KpiGrid items={kpis} />

      <div className="report-asset-snapshot avoid-break">
        <h3 className="report-panel-title">OT Unit Snapshot</h3>
        <table className="report-key-value-table report-compact-table">
          <thead>
            <tr>
              <th style={{ width: '14%' }}>Unit ID</th>
              <th style={{ width: '28%' }}>Asset Name</th>
              <th style={{ width: '16%' }}>Health</th>
              <th style={{ width: '18%' }}>Freshness (min)</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {otAssetRows.length > 0 ? (
              otAssetRows.map((row, index) => (
                <tr key={`${row.assetName}-${row.unitId}-${index}`}>
                  <td>{row.unitId}</td>
                  <td>{row.assetName}</td>
                  <td>{row.health}</td>
                  <td>{row.freshnessMinutes !== null ? row.freshnessMinutes.toFixed(1) : '-'}</td>
                  <td>{row.lastSeen ? formatLastSeen(row.lastSeen) : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                  No OT unit_id asset evidence was available for the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}

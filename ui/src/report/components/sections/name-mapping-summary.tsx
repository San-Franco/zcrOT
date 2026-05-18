import SectionWrapper from '../shared/section-wrapper';
import KpiGrid from '../shared/kpi-grid';
import { REPORT_SECTIONS } from '../../constants';
import type { ReportData, AiInsight, ReportKpiItem } from '../../types';
import { 
  deriveVisibilityCoverageRows, 
  getMappingCompletionPercent,
  getKnownMappedAssetCount
} from '../../utils/report-derivations';

interface Props { data: ReportData; insight?: AiInsight; }

export default function NameMappingSummary({ data, insight }: Props) {
  const section = REPORT_SECTIONS.find((item) => item.id === 'asset-visibility-summary')!;
  
  // Extract dynamic data
  const devices = data.latestStatus?.rows ?? [];
  const coverageItems = data.telemetryCoverage?.items ?? [];
  
  const totalObserved = devices.length;
  const healthyDevices = devices.filter((d) => d.health === 'Healthy').length;
  const staleOrMissing = coverageItems.find((item) => item.coverage_key === 'staleOrMissing')?.value ?? 0;
  const reportingNormally = coverageItems.find((item) => item.coverage_key === 'reportingNormally')?.value ?? 0;
  const knownAssets = getKnownMappedAssetCount(data);
  const identityPercent = getMappingCompletionPercent(data);
  
  // Determine statuses
  const visibilityStatus = totalObserved > 0 ? 'Strong' : 'Limited';
  const confidenceStatus = reportingNormally > 0 && staleOrMissing === 0 ? 'High' : 
                          staleOrMissing <= 2 ? 'Medium' : 'Low';
  const freshnessStatus = staleOrMissing === 0 ? 'Healthy' : 
                         staleOrMissing <= 2 ? 'Partial' : 'Stale';
  
  // Layer 2: Confidence Indicators (KPI Cards)
  const kpis: ReportKpiItem[] = [
    {
      label: 'Direct Asset Visibility',
      value: visibilityStatus,
      subtext: `${totalObserved} assets directly visible`,
      tone: visibilityStatus === 'Strong' ? 'good' : 'warning',
    },
    {
      label: 'Data Confidence',
      value: confidenceStatus,
      subtext: `${healthyDevices} of ${totalObserved} devices reporting normally`,
      tone: confidenceStatus === 'High' ? 'good' : confidenceStatus === 'Medium' ? 'warning' : 'danger',
    },
    {
      label: 'Identity Completion',
      value: `${identityPercent}%`,
      subtext: `${knownAssets} of ${totalObserved} identified`,
      tone: identityPercent >= 80 ? 'good' : identityPercent >= 50 ? 'warning' : 'danger',
    },
    {
      label: 'OT Unit Continuity',
      value: freshnessStatus,
      subtext: `${staleOrMissing} stale or missing unit statuses`,
      tone: freshnessStatus === 'Healthy' ? 'good' : freshnessStatus === 'Partial' ? 'warning' : 'danger',
    },
  ];

  // Layer 3: Coverage Assessment Table
  const coverageRows = deriveVisibilityCoverageRows(data).map((row: any) => ({
    ...row,
    explanation: row.explanation || 'No data available',
  }));

  return (
    <SectionWrapper section={section} insight={undefined} evidenceTitle={null}>
      {/* Layer 1: AI-Generated Coverage Summary */}
      {insight && !insight.isLoading && !insight.error && insight.summary && (
        <div className="report-coverage-summary avoid-break">
          <h3 className="report-panel-title">Coverage Summary</h3>
          <p className="report-summary-text">{insight.summary}</p>
        </div>
      )}

      {/* Layer 2: Confidence Indicators (KPI Strip) */}
      <KpiGrid items={kpis} />

      {/* Layer 3: Coverage Assessment (Factual Table) */}
      <div className="report-coverage-assessment avoid-break">
        <h3 className="report-panel-title">Coverage Assessment</h3>
        <table className="report-key-value-table report-compact-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Coverage Area</th>
              <th style={{ width: '14%' }}>Status</th>
              <th style={{ width: '14%' }}>Confidence</th>
              <th>Evidence / Meaning</th>
            </tr>
          </thead>
          <tbody>
            {coverageRows.map((row: any, idx: number) => (
              <tr key={idx}>
                <td>{row.item || 'No data available'}</td>
                <td>{row.status || 'No data available'}</td>
                <td>{row.confidence || 'No data available'}</td>
                <td>{row.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <p className="report-page-footnote">
        Assessment is based on evidence surfaced by the active monitoring path during the selected reporting period.
      </p>
    </SectionWrapper>
  );
}

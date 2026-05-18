import type { ReactNode } from 'react';
import type { SectionMeta, AiInsight } from '../../types';
import { REPORT_TITLE } from '../../constants';

interface Props {
  section: SectionMeta;
  insight?: AiInsight;
  children: ReactNode;
  pageBreak?: boolean;
  evidenceTitle?: string | null;
  recommendationTitle?: string;
  idSuffix?: string;
  titleOverride?: string;
}

function InsightSummary({ insight }: { insight?: AiInsight }) {
  if (!insight) return null;
  if (insight.isLoading) {
    return (
      <div className="report-story-block">
        <div className="report-summary-block ai-insight-skeleton">
          <div className="ai-skeleton-line" style={{ width: '92%' }} />
          <div className="ai-skeleton-line" style={{ width: '88%' }} />
          <div className="ai-skeleton-line" style={{ width: '78%' }} />
        </div>
      </div>
    );
  }
  if (insight.error) {
    return (
      <div className="report-story-block">
        <div className="report-summary-block report-summary-block--warning">
          <p className="report-summary-text report-summary-text--muted">{insight.error}</p>
        </div>
      </div>
    );
  }
  if (!insight.summary) return null;
  return (
    <div className="report-story-block">
      <div className="report-summary-block">
        <p className="report-summary-text">{insight.summary}</p>
      </div>
    </div>
  );
}

function InsightRecommendation({
  insight,
  title,
}: {
  insight?: AiInsight;
  title: string;
}) {
  if (!insight || insight.isLoading || insight.error || !insight.suggestion) return null;
  return (
    <div className="report-recommendation-block">
      <h3 className="report-block-title">{title}</h3>
      <p className="report-recommendation-text">{insight.suggestion}</p>
    </div>
  );
}

export default function SectionWrapper({
  section,
  insight,
  children,
  pageBreak = true,
  evidenceTitle = 'Technical Details',
  recommendationTitle = 'Recommendation',
  idSuffix,
  titleOverride,
}: Props) {
  const pageId = idSuffix ? `${section.id}-${idSuffix}` : section.id;
  const sectionTitle = titleOverride ?? section.title;

  return (
    <div
      className={`report-page ${pageBreak ? 'page-break-before' : ''}`}
      id={`section-${pageId}`}
      data-page-id={section.id}
    >
      <div className="report-section-header">
        <h2 className="report-section-title">{section.icon ? `${section.icon} ` : ''}{sectionTitle}</h2>
      </div>
      <InsightSummary insight={insight} />
      {evidenceTitle && <h3 className="report-technical-details-header">{evidenceTitle}</h3>}
      <div className="report-evidence-content report-page-content">{children}</div>
      <InsightRecommendation insight={insight} title={recommendationTitle} />
      <div className="report-footer">
        <span>{REPORT_TITLE}</span>
        <span className="page-number"></span>
      </div>
    </div>
  );
}

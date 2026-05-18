import type { ReportConfig } from '../../types';
import { REPORT_TITLE, REPORT_SUBTITLE, REPORT_PROVIDER } from '../../constants';
import { formatReportDate } from '../../utils/date-utils';

export default function CoverPage({ config }: { config: ReportConfig }) {
  const start = formatReportDate(config.startDate, 'MMMM dd, yyyy');
  const end = formatReportDate(config.endDate, 'MMMM dd, yyyy');
  const type = config.type === 'weekly' ? 'Weekly' : 'Monthly';
  return (
    <div className="report-page report-cover-page">
      <div className="report-cover-shape report-cover-shape--top" />
      <div className="report-cover-shape report-cover-shape--bottom" />
      <div className="report-cover-header">
        <div className="report-cover-logo">zcrOT</div>
        <div className="report-cover-badge">CONFIDENTIAL</div>
      </div>
      <div className="report-cover-content">
        <div className="report-cover-meta">SYSTEM • ZCROT</div>
        <h1 className="report-cover-title">{REPORT_TITLE}</h1>
        <p className="report-cover-subtitle">{REPORT_SUBTITLE}</p>
        <div className="report-cover-details">
          <div className="report-cover-detail-row">
            <span className="report-cover-detail-label">Site:</span>
            <span className="report-cover-detail-value">{config.clientName}</span>
          </div>
          <div className="report-cover-detail-row">
            <span className="report-cover-detail-label">Reporting Period:</span>
            <span className="report-cover-detail-value">{start} — {end}</span>
          </div>
          <div className="report-cover-detail-row">
            <span className="report-cover-detail-label">Generated:</span>
            <span className="report-cover-detail-value">{formatReportDate(config.generatedAt, 'dd MMM yyyy')}</span>
          </div>
          <div className="report-cover-detail-row">
            <span className="report-cover-detail-label">Report Type:</span>
            <span className="report-cover-detail-value">{type}</span>
          </div>
        </div>
      </div>
      <div className="report-cover-footer">Prepared by {REPORT_PROVIDER}</div>
      <div className="report-footer">
        <span>{REPORT_TITLE}</span>
        <span className="page-number"></span>
      </div>
    </div>
  );
}

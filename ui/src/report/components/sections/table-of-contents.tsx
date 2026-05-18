import { REPORT_SECTIONS, REPORT_TITLE } from '../../constants';

const PAGE_MAPPING: Record<string, number> = {
  'executive-summary': 3,
  'environment-overview': 4,
  'asset-visibility-summary': 5,
  'communication-overview': 6,
  'alerts-and-risk-findings': 7,
  'detection-rule-summary': 8,
  'risk-assessment-report': 10,
  'conclusion-and-next-steps': 12,
};

export default function TableOfContents() {
  const toc = REPORT_SECTIONS.filter(s => s.number > 0);
  return (
    <div className="report-page page-break-before" id="section-toc">
      <div className="report-section-header"><h2 className="report-section-title">Table of Contents</h2></div>
      <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'0.5rem', flex: 1 }}>
        {toc.map(s => (
          <a key={s.id} href={`#section-${s.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="toc-entry hover-toc" style={{ cursor: 'pointer' }}>
              <span className="toc-number">{s.number}.</span>
              <span className="toc-title">{s.title}</span>
              <span className="toc-dots" />
              <span className="toc-page" style={{ fontWeight: 600, color: '#334155', minWidth: '24px', textAlign: 'right' }}>
                {PAGE_MAPPING[s.id] || ''}
              </span>
            </div>
          </a>
        ))}
      </div>
      <div className="report-footer">
        <span>{REPORT_TITLE}</span>
        <span className="page-number"></span>
      </div>
    </div>
  );
}

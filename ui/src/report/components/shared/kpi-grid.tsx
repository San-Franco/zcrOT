import { Card, CardContent, CardTitle } from '@/components/ui/card';
import type { ReportKpiItem } from '../../types';

export default function KpiGrid({ items }: { items: ReportKpiItem[] }) {
  if (!items.length) return null;
  return (
    <div className="report-kpi-grid avoid-break">
      {items.map((item, i) => (
        <Card key={i} className={`report-kpi-card report-kpi-card--${item.tone} gap-0 py-0`}>
          <CardContent className="report-kpi-card-content px-0">
            <CardTitle className="report-kpi-label">{item.label}</CardTitle>
            <div className="report-kpi-value">{item.value}</div>
            {item.subtext && <div className="report-kpi-subtext">{item.subtext}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

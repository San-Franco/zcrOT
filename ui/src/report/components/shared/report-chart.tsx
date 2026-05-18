import type { ReactNode } from 'react';
export default function ReportChart({ title, children, height = 220 }: { title: string; children: ReactNode; height?: number }) {
  return (
    <div className="report-chart-container avoid-break">
      <div className="report-chart-title">{title}</div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}

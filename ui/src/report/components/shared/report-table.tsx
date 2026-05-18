import type { ReactNode } from 'react';

interface Col<T> { key: string; label: string; render?: (row: T) => ReactNode; align?: 'left'|'center'|'right'; width?: string; }

export default function ReportTable<T extends Record<string, unknown>>({ columns, data, maxRows, caption }: { columns: Col<T>[]; data: T[]; maxRows?: number; caption?: string }) {
  const rows = maxRows ? data.slice(0, maxRows) : data;
  return (
    <div className="report-table-shell avoid-break">
      <table className="report-table">
        {caption && <caption className="report-table-caption">{caption}</caption>}
        <thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: c.align ?? 'left', width: c.width }}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="report-table-empty">No data available</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i}>{columns.map(c => <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

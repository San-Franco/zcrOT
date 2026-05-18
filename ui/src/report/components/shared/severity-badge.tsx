export default function SeverityBadge({ level }: { level: string }) {
  const n = level.toLowerCase().replace(/[_\s]+/g, '-');
  const map: Record<string,{ cls:string; lbl:string }> = {
    low:       { cls:'severity-badge--low',      lbl:'Low' },
    medium:    { cls:'severity-badge--medium',   lbl:'Medium' },
    high:      { cls:'severity-badge--high',     lbl:'High' },
    critical:  { cls:'severity-badge--critical', lbl:'Critical' },
    'likely-legitimate':            { cls:'severity-badge--low',      lbl:'Legitimate' },
    'likely-legitimate-unknown-ip': { cls:'severity-badge--medium',   lbl:'Unknown IP' },
    'under-investigation':          { cls:'severity-badge--high',     lbl:'Investigating' },
    'likely-attack':                { cls:'severity-badge--critical', lbl:'Likely Attack' },
  };
  const m = map[n] ?? { cls:'severity-badge--info', lbl:level };
  return <span className={`severity-badge ${m.cls}`}>{m.lbl}</span>;
}

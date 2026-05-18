export default function HealthIndicator({ health }: { health: string }) {
  const n = health.toLowerCase();
  const dot = n === 'watch' ? 'health-dot--watch' : n === 'limited' ? 'health-dot--limited' : 'health-dot--healthy';
  return <span style={{ display:'inline-flex', alignItems:'center' }}><span className={`health-dot ${dot}`} />{health}</span>;
}

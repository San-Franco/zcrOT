import type { AiInsight } from '../../types';

export default function AiInsightCard({ insight }: { insight: AiInsight }) {
  if (insight.isLoading) return (
    <div className="ai-insight-skeleton">
      <div className="ai-skeleton-line" style={{ width: '90%' }} />
      <div className="ai-skeleton-line" style={{ width: '75%' }} />
      <div className="ai-skeleton-line" style={{ width: '85%' }} />
      <div className="ai-skeleton-line" style={{ width: '60%' }} />
    </div>
  );
  if (insight.error) return (
    <div className="ai-insight-card ai-insight-card--warning">
      <div className="ai-insight-label">AI Insight Unavailable</div>
      <div className="ai-insight-text" style={{ color: '#92400e' }}>{insight.error}</div>
    </div>
  );
  if (!insight.summary && !insight.suggestion) return null;
  const cls = ['ai-insight-card', (insight.riskLevel === 'critical' || insight.riskLevel === 'high') ? 'ai-insight-card--danger' : '', insight.riskLevel === 'medium' ? 'ai-insight-card--warning' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {insight.summary && <div className="ai-insight-text">{insight.summary}</div>}
      {insight.suggestion && <><div className="ai-suggestion-label">Recommendation</div><div className="ai-suggestion-text">{insight.suggestion}</div></>}
    </div>
  );
}

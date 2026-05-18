import { DEMO_CUSTOMER_NAME, DEMO_REPORT_TITLE, DEMO_SITE_NAME } from '@/mock/demo-config';
import type { LimitationItem, SectionId, SectionMeta } from './types';

export const REPORT_SECTIONS: SectionMeta[] = [
  { id: 'cover', number: 0, title: 'Cover Page', subtitle: '', icon: '' },
  { id: 'toc', number: 0, title: 'Table of Contents', subtitle: '', icon: '' },
  { id: 'executive-summary', number: 1, title: 'Executive Summary', subtitle: 'Overall assessment, evidence snapshot, and key recommendations', icon: '' },
  { id: 'environment-overview', number: 2, title: 'Monitored Environment Overview', subtitle: 'Observed OT assets, telemetry sources, and operational monitoring context', icon: '' },
  { id: 'asset-visibility-summary', number: 3, title: 'Asset Visibility Findings', subtitle: 'Visibility status, reporting quality, and observed asset evidence', icon: '' },
  { id: 'communication-overview', number: 4, title: 'Communication & Control Paths', subtitle: 'Observed traffic paths, protocols, and control behavior', icon: '' },
  { id: 'alerts-and-risk-findings', number: 5, title: 'Risk Observations & Alerts', subtitle: 'Detected alerts, severity distribution, and supporting evidence', icon: '' },
  { id: 'detection-rule-summary', number: 6, title: 'Detection Readiness', subtitle: 'Detection feasibility, active rules, and current readiness', icon: '' },
  { id: 'risk-assessment-report', number: 7, title: 'Risk Assessment', subtitle: 'Weaknesses, exposure implications, and protection priorities', icon: '' },
  { id: 'conclusion-and-next-steps', number: 8, title: 'Conclusion', subtitle: 'Final management closing statement', icon: '' },
];

export const REPORT_COLORS = {
  primary: '#2f80ed',
  secondary: '#38509e',
  accent: '#4c3390',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#94a3b8',
  chart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  severity: { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444', info: '#3b82f6' } as const,
  verdict: { likely_legitimate: '#10b981', likely_legitimate_unknown_ip: '#f59e0b', under_investigation: '#f97316', likely_attack: '#ef4444' } as const,
};

export const A4_CONFIG = { widthMm: 210, heightMm: 297, marginMm: 12.7, widthPx: 794, heightPx: 1123, marginPx: 48 };

export const LOCAL_REPORT_SIMULATION_CONFIG = {
  mode: 'frontend-demo',
  simulatedAiLabel: 'Local deterministic narrative generator',
};

export const AI_REPORT_SYSTEM_PROMPT = `You are writing a client-facing OT monthly report narrative.

Rules:
- Use only the provided evidence. Never invent metrics, incidents, assets, or causes.
- This report is based on passive monitoring and current telemetry coverage. State limitations when relevant.
- Separate observed facts from interpretation. Do not claim confirmed compromise unless evidence explicitly says so.
- Avoid generic filler, dramatic tone, and repeated KPI restatements.
- Avoid low-level packet/protocol/port/IP narration in narrative body unless absolutely necessary.
- Do not repeat the same metric under different labels.
- If two metrics are related, explain the relationship once.
- Keep language direct, professional, and readable for business stakeholders.
- Keep each section concise (one short paragraph for summary fields, one short paragraph for recommendations).
- If data is insufficient, say visibility is limited instead of guessing.

Output format (strict JSON only):
{
  "summary": "string",
  "suggestion": "string"
}`;

export const AI_SECTION_INSTRUCTIONS: Record<SectionId, string> = {
  cover: 'No narrative generation.',
  toc: 'No narrative generation.',
  'executive-summary': `Write an executive period summary.
- Focus on what was observed in the selected reporting window.
- Mention communication visibility, device mapping state, event posture, and one key limitation.
- Do not provide recommendation text for this section (leave suggestion empty).`,
  'environment-overview': `Write a monitored-environment framing paragraph.
- Explain monitoring scope and evidence basis for this period.
- Keep it factual and concise.
- Do not provide recommendation text for this section (leave suggestion empty).`,
  'asset-visibility-summary': `Write an asset visibility paragraph.
- Explain OT unit asset visibility, known-vs-unknown mapping status, and monitoring continuity.
- Acknowledge visibility boundaries.
- Do not provide recommendation text for this section (leave suggestion empty).`,
  'communication-overview': `Write a communication and control-path paragraph.
- Explain observed path patterns, control stability, and notable exposure signals.
- Do not provide recommendation text for this section (leave suggestion empty).`,
  'alerts-and-risk-findings': `Write a grounded Risk Assessment paragraph.
- This is a concise Risk Observations section, not the full Risk Assessment page.
- Summarize key observed risk indicators only: severity mix, verdict posture, and concentration signals.
- Avoid repeating detailed content that belongs in the dedicated Risk Assessment Report page.
- suggestion may contain one short operational follow-up note.`,
  'detection-rule-summary': `Write a detection-readiness paragraph.
- Explain rule coverage, observed detection signals, and feasibility strengths/limitations.
- Keep recommendation practical and tied to evidence.
- suggestion may contain one short readiness-improvement recommendation paragraph.`,
  'risk-assessment-report': `Write a decision-maker friendly Risk Assessment narrative.
- Explain current weaknesses and protection gaps in plain business/technical language.
- Cover why these weaknesses matter and what they could lead to if not improved.
- Include visibility boundaries honestly without sounding uncertain or vague.
- Do not write as packet analysis, SOC console notes, or penetration test style.
- Do not include IP-by-IP, port-by-port, or protocol-deep narration in the paragraph text.
- summary should be a concise "A. Risk Overview" paragraph.
- suggestion should be concise "D. Protection Priorities" guidance in plain language.`,
  'conclusion-and-next-steps': `Write a final monthly conclusion paragraph.
- summary: synthesize the reporting period outcome (asset visibility, communication, security profile, incidents, control reliability, detection readiness, and what needs attention).
- suggestion: leave empty unless required for clarity.
- Keep it strong and professional. Avoid generic limitation disclaimers and avoid repeating all KPIs mechanically.`,
};

export const DEFAULT_CLIENT_NAME = `${DEMO_CUSTOMER_NAME} / ${DEMO_SITE_NAME}`;
export const REPORT_TITLE = DEMO_REPORT_TITLE;
export const REPORT_SUBTITLE = 'Operational monitoring report generated from fictional ABC Industrial demo telemetry within the selected reporting period';
export const REPORT_PROVIDER = 'zcrOT Demo';
export const CONFIDENTIALITY_NOTICE = 'CONFIDENTIAL — This document contains proprietary and confidential information. Distribution is limited to authorized personnel only.';

export const KNOWN_LIMITATIONS: LimitationItem[] = [
  { id: 'lim-1', area: 'Network Session Visibility', description: 'The demo shows direct Ethernet/IP visibility for router, switch, gateway, cloud gateway, EV Charger, and workstation assets only.', impact: 'medium', mitigation: 'Add a passive sensor or SPAN/TAP feed when deeper packet-level validation is required.' },
  { id: 'lim-2', area: 'Command Source Attribution', description: 'Downstream Unit 1, Unit 11, and Unit 100 are logical OT entities identified through OT Gateway telemetry, not independent IP/MAC endpoints.', impact: 'high', mitigation: 'Correlate gateway telemetry with passive network monitoring before making direct-device attribution claims.' },
  { id: 'lim-3', area: 'Remote Session Detection', description: 'Remote maintenance visibility is based on observed gateway/cloud communication metadata in this frontend demo.', impact: 'medium', mitigation: 'Use session-level protocol analysis and approved maintenance windows in production deployments.' },
  { id: 'lim-4', area: 'Protocol-Aware Control Path', description: 'The demo uses Modbus-style unit polling summaries and does not claim full serial/RS485 packet visibility.', impact: 'medium', mitigation: 'Deploy protocol-aware OT monitoring for deeper Modbus/TCP and serial gateway inspection.' },
  { id: 'lim-5', area: 'Complete Asset Inventory', description: 'Coverage status distinguishes directly visible network assets from gateway-managed downstream logical units and blind spots.', impact: 'low', mitigation: 'Combine passive discovery, gateway telemetry, and periodic asset review for complete inventory confidence.' },
];

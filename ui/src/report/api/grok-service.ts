import type { AiInsight, SectionId } from '../types';

type FallbackContext = {
  summary?: unknown;
  suggestion?: unknown;
  riskLevel?: unknown;
};

type SectionEvidenceInput = {
  fallback?: FallbackContext;
  evidence?: {
    headline?: unknown;
    riskPosture?: unknown;
    coverageStatus?: unknown;
    recommendations?: unknown;
  };
  [key: string]: unknown;
};

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeRisk(value: unknown): AiInsight['riskLevel'] {
  const normalized = sanitizeText(value).toLowerCase();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high' || normalized === 'critical') {
    return normalized;
  }
  return 'info';
}

function localSummary(sectionId: SectionId, sectionTitle: string, context: SectionEvidenceInput): string {
  const fallback = sanitizeText(context.fallback?.summary);
  if (fallback) {
    return fallback;
  }

  const headline = sanitizeText(context.evidence?.headline);
  if (headline) {
    return headline;
  }

  const coverage = sanitizeText(context.evidence?.coverageStatus);
  const posture = sanitizeText(context.evidence?.riskPosture);

  if (sectionId === 'executive-summary') {
    return 'ABC Industrial demo telemetry shows useful OT asset and communication visibility, with direct network visibility for core Ethernet/IP assets and indirect gateway-managed visibility for downstream logical OT units.';
  }

  if (sectionId === 'environment-overview') {
    return 'The monitored scope represents an industrial energy factory environment with solar inverter, power meter, environmental sensor, EV Charger, gateway, switching, routing, and cloud communication paths.';
  }

  if (sectionId === 'asset-visibility-summary') {
    return `Asset visibility is ${coverage || 'partial'} because downstream unit visibility is derived from OT Gateway telemetry rather than direct IP/MAC discovery.`;
  }

  if (sectionId === 'communication-overview') {
    return 'Observed communication paths show expected gateway, cloud, EV Charger, NTP, and engineering workstation activity, plus an unknown client path used for investigation workflows.';
  }

  if (sectionId === 'alerts-and-risk-findings') {
    return `Risk posture is ${posture || 'medium'} with attention focused on unknown client access, after-hours remote maintenance, and Modbus polling degradation examples.`;
  }

  if (sectionId === 'detection-rule-summary') {
    return 'Detection readiness is demonstrated through local rules for unknown clients, remote maintenance, Modbus polling behavior, cloud egress deviations, and EV Charger communication anomalies.';
  }

  if (sectionId === 'risk-assessment-report') {
    return 'The main demo risk is not a claim of compromise; it is the operational gap between directly visible Ethernet/IP assets and downstream OT units that are only visible through gateway telemetry.';
  }

  if (sectionId === 'conclusion-and-next-steps') {
    return 'The demo provides a realistic OT visibility story while preserving clear limitations around indirect downstream device coverage and frontend-only simulated telemetry.';
  }

  return `${sectionTitle} generated locally from deterministic frontend demo data.`;
}

function localSuggestion(sectionId: SectionId, context: SectionEvidenceInput): string {
  const fallback = sanitizeText(context.fallback?.suggestion);
  if (fallback) {
    return fallback;
  }

  if (sectionId === 'alerts-and-risk-findings') {
    return 'Review the unknown client and remote maintenance examples first, then confirm whether any allowlist scope should be tightened in the demo policy set.';
  }

  if (sectionId === 'detection-rule-summary') {
    return 'Keep the gateway telemetry rules active and use shadow mode for new cloud or EV Charger behavioral detections until baseline confidence improves.';
  }

  if (sectionId === 'risk-assessment-report') {
    return 'Prioritize identity mapping, approved maintenance windows, gateway telemetry health, and passive network visibility for direct Ethernet/IP assets.';
  }

  const recommendations = context.evidence?.recommendations;
  if (Array.isArray(recommendations) && recommendations.length > 0) {
    return recommendations.slice(0, 2).map((item) => String(item)).join(' ');
  }

  return '';
}

export async function generateSectionInsight(
  sectionId: SectionId,
  sectionTitle: string,
  context: SectionEvidenceInput,
): Promise<AiInsight> {
  await new Promise((resolve) => window.setTimeout(resolve, 90));

  const summary = localSummary(sectionId, sectionTitle, context);
  const suggestion = localSuggestion(sectionId, context);
  const riskLevel = sanitizeRisk(context.fallback?.riskLevel);

  return {
    summary,
    suggestion,
    riskLevel,
    isLoading: false,
    error: null,
  };
}


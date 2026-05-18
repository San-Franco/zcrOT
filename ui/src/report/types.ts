/* ── Report-specific TypeScript types ──────────── */

export type ReportType = 'weekly' | 'monthly';

export interface ReportConfig {
  type: ReportType;
  startDate: string;
  endDate: string;
  clientName: string;
  generatedAt: string;
}

export type SectionId =
  | 'cover' | 'toc' | 'executive-summary' | 'environment-overview'
  | 'asset-visibility-summary' | 'communication-overview' | 'alerts-and-risk-findings'
  | 'detection-rule-summary'
  | 'risk-assessment-report'
  | 'conclusion-and-next-steps';

export interface SectionMeta {
  id: SectionId;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
}

export interface AiInsight {
  summary: string;
  suggestion: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'info';
  isLoading: boolean;
  error: string | null;
}

export interface ReportData {
  config: ReportConfig;
  powerKpis: PowerMonitoringKpisResponse | null;
  powerTrend: PowerMonitoringPowerTrendResponse | null;
  environmentalSignals: PowerMonitoringEnvironmentalSignalsResponse | null;
  telemetryProfile: PowerMonitoringTelemetryProfileResponse | null;
  reportingCadence: PowerMonitoringReportingCadenceResponse | null;
  telemetryCoverage: PowerMonitoringTelemetryCoverageResponse | null;
  latestStatus: PowerMonitoringLatestStatusResponse | null;
  commKpis: OtCommunicationControlKpisResponse | null;
  commFlow: OtCommunicationControlFlowResponse | null;
  commTopFlows: OtCommunicationControlTopFlowsResponse | null;
  modbusResponseTime: OtCommunicationControlModbusResponseTimeResponse | null;
  modbusRequestsErrors: OtCommunicationControlModbusRequestsErrorsResponse | null;
  modbusUnitHealth: OtCommunicationControlModbusUnitHealthResponse | null;
  securityKpis: OtSecurityExposureKpisResponse | null;
  securityEventsOverTime: OtSecurityExposureEventsOverTimeResponse | null;
  securityVerdictDist: OtSecurityExposureVerdictDistributionResponse | null;
  securityTopRisky: OtSecurityExposureTopRiskySourcesResponse | null;
  deviceMappings: DetectionDeviceNameMappingApiRow[] | null;
  detectionRules: DetectionRuleApiRow[] | null;
  detectionIncidents: DetectionIncidentApiRow[] | null;
  isLoading: boolean;
  error: string | null;
}

export type ExportFormat = 'pdf' | 'docx';

export interface ReportKpiItem {
  label: string;
  value: string;
  subtext?: string;
  tone: 'good' | 'warning' | 'danger' | 'neutral';
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  category: string;
}

export interface LimitationItem {
  id: string;
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ReportDateRange {
  startIso: string;
  endIso: string;
  periodLabel: string;
  startLabel: string;
  endLabel: string;
}

export interface ReportTelemetryAssetRow {
  assetName: string;
  deviceType: string;
  unitId: number | null;
  site: string;
  lastSeen: string;
  health: string;
  freshnessMinutes: number | null;
}

export interface ReportOtAssetRow {
  unitId: number;
  assetName: string;
  health: string;
  lastSeen: string;
  freshnessMinutes: number | null;
}

export interface ReportDeviceMetrics {
  observedAssets: number;
  knownDevices: number;
  unknownDevices: number;
  observedMappedDevices: number;
  mappingCoveragePercent: number;
  telemetryAssetCount: number;
  reportingNormally: number;
  limitedTelemetry: number;
  staleOrMissing: number;
  healthyTelemetryAssets: number;
  telemetryAssets: ReportTelemetryAssetRow[];
}

export interface ReportOtAssetMetrics {
  otAssetCount: number;
  reportingUnitCount: number;
  staleOrMissingUnitCount: number;
  otAssets: ReportOtAssetRow[];
  summary: string;
}

export interface ReportProtocolBreakdownItem {
  protocol: string;
  events: number;
}

export interface ReportCommunicationPathRow {
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  port: string;
  direction: string;
  eventCount: number;
  unknownClientEvents: number;
  likelyAttackEvents: number;
  outsideHoursEvents: number;
  maxRiskScore: number;
  avgRiskScore: number;
  firstSeen: string;
  lastSeen: string;
}

export interface ReportOtControlUnitRow {
  unitId: number;
  unitLabel: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  slowCount: number;
  successRate: number;
  avgResponseTimeMs: number | null;
  maxResponseTimeMs: number | null;
}

export interface ReportCommunicationMetrics {
  communicationPaths: number;
  internalPaths: number;
  externalPaths: number;
  unknownDirectionPaths: number;
  flowEvents: number;
  unknownClientEvents: number;
  outsideHoursEvents: number;
  likelyAttackFlowEvents: number;
  modbusDisruptedEvents: number;
  highRiskFlows: number;
  highRiskFlowEvents: number;
  riskSources: number;
  primaryParticipant: string;
  modbusRequests: number;
  modbusErrors: number;
  modbusSlowPolls: number;
  modbusSuccessRate: number;
  controlStability: 'Stable' | 'Watch' | 'Degraded';
  otUnitParticipationCount: number;
  otUnitsWithErrors: number;
  otUnitsWithSlowPolls: number;
  primaryOtControlUnit: string;
  otControlSummary: string;
  topOtControlUnits: ReportOtControlUnitRow[];
  controlReliabilitySummary: string;
  protocolBreakdown: ReportProtocolBreakdownItem[];
  notablePaths: ReportCommunicationPathRow[];
}

export interface ReportRiskSourceRow {
  sourceIp: string;
  eventCount: number;
  maxRiskScore: number;
  avgRiskScore: number;
}

export interface ReportRiskMetrics {
  totalSecurityEvents: number;
  highSeverityEvents: number;
  severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  verdict: {
    likelyLegitimate: number;
    likelyLegitimateUnknownIp: number;
    underInvestigation: number;
    likelyAttack: number;
  };
  unknownClientEvents: number;
  likelyAttackEvents: number;
  externalOriginEvents: number;
  riskSources: number;
  maxRiskScore: number;
  avgRiskScore: number;
  topRiskSources: ReportRiskSourceRow[];
  riskPosture: 'Low' | 'Medium' | 'High';
}

export interface ReportIncidentGroupRow {
  groupKey: string;
  incidentCount: number;
  openIncidentCount: number;
  eventCount: number;
  maxSeverity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  maxRiskScore: number;
}

export interface ReportIncidentMetrics {
  totalIncidentCount: number;
  openIncidentCount: number;
  acknowledgedIncidentCount: number;
  closedIncidentCount: number;
  topIncidentGroups: ReportIncidentGroupRow[];
  incidentsInPeriod: DetectionIncidentApiRow[];
  groupingStrategy: string;
}

export interface DetectionFeasibilityRow {
  detectionType: string;
  feasibility: 'High' | 'Partial' | 'Low';
  evidenceBasis: string;
  limitationNote: string;
}

export interface ReportDetectionMetrics {
  totalRuleCount: number;
  defaultRuleCount: number;
  customRuleCount: number;
  activeRuleCount: number;
  inactiveRuleCount: number;
  rulesConsideredForPeriod: number;
  signals: {
    unknownClient: number;
    outsideHours: number;
    likelyAttack: number;
    modbusDisrupted: number;
    externalOrigin: number;
  };
  signalCategoryCount: number;
  highFeasibilityCount: number;
  partialFeasibilityCount: number;
  lowFeasibilityCount: number;
  readiness: 'Strong' | 'Moderate' | 'Limited';
  feasibilityRows: DetectionFeasibilityRow[];
}

export interface ReportCoverageMetrics {
  monitoringCoverageStatus: 'Strong' | 'Partial' | 'Limited';
  monitoringCoverageSummary: string;
  visibilityGapSummary: string;
  visibilityGaps: string[];
  productionReadiness: 'Ready' | 'Conditional' | 'Not Ready';
}

export interface ReportNarrativeSummary {
  executiveSummary: string;
  environmentOverview: string;
  assetVisibility: string;
  communication: string;
  risk: string;
  detection: string;
  riskAssessmentReport: string;
  conclusion: string;
}

export interface ReportAiEvidencePack {
  reportingWindow: {
    startIso: string;
    endIso: string;
    periodLabel: string;
  };
  reportContext: {
    site: string;
    reportType: ReportType;
  };
  otAssetVisibility: {
    otAssetCount: number;
    reportingUnitCount: number;
    staleOrMissingUnitCount: number;
    otAssetExamples: Array<{
      unitId: number;
      assetName: string;
      health: string;
      freshnessMinutes: number | null;
    }>;
    summary: string;
  };
  deviceVisibility: {
    knownDevices: number;
    unknownDevices: number;
    observedAssets: number;
    observedMappedDevices: number;
    mappingCoveragePercent: number;
    mappedDeviceExamples: Array<{ ip: string; name: string }>;
  };
  communicationVisibility: {
    communicationPaths: number;
    flowEvents: number;
    internalPaths: number;
    externalPaths: number;
    unknownDirectionPaths: number;
    otUnitParticipationCount: number;
    otUnitsWithErrors: number;
    otUnitsWithSlowPolls: number;
    topOtControlUnits: Array<{
      unitId: number;
      unitLabel: string;
      totalRequests: number;
      successRate: number;
      errorCount: number;
      slowCount: number;
      avgResponseTimeMs: number | null;
    }>;
    topProtocols: Array<{ protocol: string; events: number }>;
    notablePaths: Array<{
      sourceIp: string;
      destinationIp: string;
      protocol: string;
      direction: string;
      eventCount: number;
      maxRiskScore: number;
      unknownClientFlowEvents: number;
    }>;
  };
  riskEvidence: {
    securityEvents: number;
    highSeverityEvents: number;
    likelyAttackEvents: number;
    unknownClientSecurityEvents: number;
    externalOriginEvents: number;
    highRiskFlows: number;
    highRiskFlowEvents: number;
    riskSources: number;
    topRiskSources: Array<{
      sourceIp: string;
      eventCount: number;
      maxRiskScore: number;
      avgRiskScore: number;
    }>;
  };
  incidentEvidence: {
    totalIncidentCount: number;
    openIncidentCount: number;
    acknowledgedIncidentCount: number;
    closedIncidentCount: number;
    groupingStrategy: string;
    topIncidentGroups: Array<{
      groupKey: string;
      incidentCount: number;
      openIncidentCount: number;
      eventCount: number;
      maxSeverity: string;
      maxRiskScore: number;
    }>;
  };
  detectionEvidence: {
    totalRuleCount: number;
    defaultRuleCount: number;
    customRuleCount: number;
    activeRuleCount: number;
    inactiveRuleCount: number;
    signalCategoryCount: number;
    detectionSignals: {
      unknownClient: number;
      outsideHours: number;
      likelyAttack: number;
      modbusDisrupted: number;
      externalOrigin: number;
    };
    feasibilitySummary: {
      high: number;
      partial: number;
      low: number;
      readiness: 'Strong' | 'Moderate' | 'Limited';
    };
  };
  controlReliability: {
    modbusSuccessRate: number;
    modbusErrors: number;
    modbusSlowPolls: number;
    controlStability: 'Stable' | 'Watch' | 'Degraded';
    summary: string;
  };
  monitoringCoverage: {
    coverageStatus: 'Strong' | 'Partial' | 'Limited';
    reportingNormally: number;
    limitedTelemetry: number;
    staleOrMissing: number;
    note: string;
  };
  coverageEvidence: {
    monitoringCoverageSummary: string;
    visibilityGapSummary: string;
    visibilityGaps: string[];
    productionReadiness: 'Ready' | 'Conditional' | 'Not Ready';
  };
  normalizedMetrics: {
    knownDeviceCount: number;
    unknownDeviceCount: number;
    otAssetCount: number;
    observedIpAssetCount: number;
    observedAssetCount: number;
    communicationPathCount: number;
    internalPathCount: number;
    externalPathCount: number;
    unknownDirectionPathCount: number;
    totalSecurityEventCount: number;
    likelyAttackEventCount: number;
    unknownClientEventCount: number;
    externalOriginEventCount: number;
    highSeverityEventCount: number;
    highRiskFlowCount: number;
    highRiskFlowEventCount: number;
    riskSourceCount: number;
    totalIncidentCount: number;
    defaultRuleCount: number;
    customRuleCount: number;
    detectionReadinessSummary: string;
    detectionFeasibilitySummary: string;
    controlReliabilitySummary: string;
    monitoringCoverageSummary: string;
    visibilityGapSummary: string;
  };
  limitations: string[];
}

export interface ReportMetrics {
  dateRange: ReportDateRange;
  otAssets: ReportOtAssetMetrics;
  devices: ReportDeviceMetrics;
  communication: ReportCommunicationMetrics;
  risk: ReportRiskMetrics;
  incidents: ReportIncidentMetrics;
  detection: ReportDetectionMetrics;
  coverage: ReportCoverageMetrics;
  narratives: ReportNarrativeSummary;
  aiEvidence: ReportAiEvidencePack;
}

export interface ConclusionPageInput {
  report_start: string;
  report_end: string;
  overall_risk_level: string;
  risk_findings_count: number;
  observed_coverage_status: string;
  observed_assets: number;
  observed_paths: number;
  control_reliability_status: string;
  modbus_success_rate: number;
  modbus_error_count: number;
  detection_readiness_status: string;
  high_feasibility_count: number;
  partial_feasibility_count: number;
  low_feasibility_count: number;
  stale_or_missing_count: number;
  high_risk_source_count: number;
  high_risk_flow_count: number;
  total_incident_count: number;
  default_rule_count: number;
  custom_rule_count: number;
  visibility_limitation_summary: string;
}

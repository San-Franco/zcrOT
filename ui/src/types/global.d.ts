export {};

declare global {
    type UserRole = "admin" | "viewer" | "user";
    type UserStatus = "active" | "inactive" | "locked" | "pending_verification" | "suspended";

    type Filter = {
        name: string;
        value: string;
    };

    interface Tab {
        id: string;
        label: string;
        path?: string;
        icon: React.ComponentType<{ className?: string }>;
        description?: string;
        requireAdmin?: boolean;
        disabled?: boolean;
        isPrivilege?: boolean;
    }

    type TableColumnToggleOption = {
        id: string;
        label: string;
    };

    type UserTableColumnPreferences = Record<string, string[]>;

    type LoginActionData = {
        message?: string;
        error?: {
            code?: string;
            message?: string;
            status_code?: number;
            remaining_minutes?: number;
            remaining_seconds?: number;
            lockout_duration_minutes?: number;
            locked_by_admin?: boolean;
        };
    };

    type User = {
        id: number;
        username: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        notification_enabled: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
        permissions?: string[];
    };

    type UserManagementUserStatus = UserStatus;

    type UserManagementStatusFilter = "all" | UserManagementUserStatus;
    type UserManagementRoleFilter = "all" | UserRole;

    type UserManagementApiUserRow = {
        id: number;
        username: string;
        email: string;
        role: UserRole;
        status: UserManagementUserStatus;
        notification_enabled: boolean;
        last_login: string | null;
        created_at: string;
        updated_at: string;
    };

    type UserManagementUser = {
        id: number;
        username: string;
        email: string;
        role: UserRole;
        status: UserManagementUserStatus;
        notificationEnabled: boolean;
        lastLogin: string | null;
        createdAt: string;
        updatedAt: string;
    };

    type UserManagementListResponse = {
        rows: UserManagementApiUserRow[];
        total: number;
        page: number;
        per_page: number;
        has_more: boolean;
    };

    type UserManagementUpsertFormValues = {
        username: string;
        email: string;
        role: UserRole;
        status: UserManagementUserStatus;
        notificationEnabled: boolean;
        password?: string;
        confirmPassword?: string;
    };

    type UserManagementCreatePayload = {
        username: string;
        email: string;
        password: string;
        role: UserRole;
        status: UserManagementUserStatus;
        notification_enabled: boolean;
    };

    type UserManagementUpdatePayload = {
        username: string;
        email: string;
        role: UserRole;
        status: UserManagementUserStatus;
        notification_enabled: boolean;
    };

    type UserManagementCreateFormValues = UserManagementUpsertFormValues & {
        password: string;
        confirmPassword: string;
    };

    type UserManagementEditFormValues = Omit<UserManagementUpsertFormValues, "password" | "confirmPassword">;

    type AuthSessionResponse = {
        message: string;
        user: User;
    };

    type LogoutResponse = {
        success: boolean;
        message: string;
    };

    type ApiErrorResponse = {
        detail?: string | {
            code?: string;
            message?: string;
            remaining_minutes?: number;
            remaining_seconds?: number;
            lockout_duration_minutes?: number;
            locked_by_admin?: boolean;
        };
        error?: {
            code?: string;
            message?: string;
            status_code?: number;
        };
    };

    type PortStatus = "ACTIVE" | "INACTIVE";

    type PortItem = {
        id: number;
        port_number: number;
        label: string | null;
        description: string | null;
        failover_ports: number[];
        is_active: boolean;
        is_primary: boolean;
        status: PortStatus;
        last_activity: string | null;
        error_message: string | null;
        logs_received_count: number;
        created_at: string;
        updated_at: string;
    };

    type PortFormValues = {
        label: string;
        description: string;
        status: PortStatus;
    };

    type PortListResponse = {
        ports: PortItem[];
        total_count: number;
        active_count: number;
        inactive_count: number;
    };

    type PortStatusLogItem = {
        id: number;
        status: string;
        error_message: string | null;
        logs_received_count: number;
        timestamp: string;
    };

    type PortTestResponse = {
        port_number: number;
        success: boolean;
        test_timestamp: string;
        duration_ms: number;
        error_message: string | null;
    };

    type PortRuntimeActionResponse = {
        success: boolean;
        message: string;
        config_written: boolean;
        runtime_mapping_written: boolean;
        runtime_applied: boolean;
        runtime_method: string;
        applied_at: string;
    };

    type UiNotificationSeverity = "High" | "Info" | "Draft";

    type UiNotificationItem = {
        title: string;
        body: string;
        severity: UiNotificationSeverity;
        time: string;
    };

    type PowerMonitoringTimeRange = "1h" | "3h" | "24h" | "3d" | "7d";
    type PowerMonitoringQueryTimeRange = PowerMonitoringTimeRange | "custom";

    type PowerMetricTone = "sky" | "emerald" | "amber" | "violet" | "rose";
    type PowerMetricTrend = "up" | "down" | "steady";

    type PowerMetricCard = {
        id: string;
        title: string;
        value: string;
        delta: string;
        helper: string;
        trend: PowerMetricTrend;
        tone: PowerMetricTone;
    };

    type PowerTrendPoint = {
        time: string;
        smartloggerAggregate: number | null;
        inverterOutput: number | null;
        meterActivePower: number | null;
    };

    type PowerEnvironmentalPoint = {
        time: string;
        irradianceSecondary: number | null;
        moduleTemperature: number | null;
        activePower: number | null;
        meterVoltage: number | null;
    };

    type PowerTelemetryProfileItem = {
        deviceType: string;
        deviceCount: number;
        signalCount: number;
        reportingIntervalSeconds: number;
        visibilityLabel: string;
        fill: string;
    };

    type PowerReportingCadenceRow = {
        window: string;
        smartlogger3000: number;
        inverter: number;
        power_meter: number;
        emi: number;
    };

    type PowerTelemetryCoverageItem = {
        coverageKey: "reportingNormally" | "limitedTelemetry" | "staleOrMissing";
        name: string;
        value: number;
        fill: string;
    };

    type PowerLatestStatusRow = {
        deviceName: string;
        deviceType: string;
        unitId: number;
        site: string;
        lastSeen: string;
        freshnessMinutes: number;
        health: "Healthy" | "Watch" | "Limited";
        summary: string;
        activePower?: number;
        dailyEnergy?: number;
        meterVoltage?: number;
        meterActivePower?: number;
        irradianceSecondary?: number;
        moduleTemperature?: number;
    };

    type PowerDashboardData = {
        metrics: PowerMetricCard[];
        powerTrend: PowerTrendPoint[];
        environmentalSignals: PowerEnvironmentalPoint[];
        telemetryProfile: PowerTelemetryProfileItem[];
        reportingCadence: PowerReportingCadenceRow[];
        telemetryCoverage: PowerTelemetryCoverageItem[];
        latestStatus: PowerLatestStatusRow[];
    };

    type FetchPowerMonitoringKpisParams = {
        timeRange?: PowerMonitoringQueryTimeRange;
        customStart?: string | null;
        customEnd?: string | null;
    };

    type FetchPowerMonitoringPowerTrendParams = FetchPowerMonitoringKpisParams;
    type FetchPowerMonitoringEnvironmentalSignalsParams = FetchPowerMonitoringKpisParams;
    type FetchPowerMonitoringTelemetryProfileParams = FetchPowerMonitoringKpisParams;
    type FetchPowerMonitoringReportingCadenceParams = FetchPowerMonitoringKpisParams;
    type FetchPowerMonitoringTelemetryCoverageParams = FetchPowerMonitoringKpisParams;
    type FetchPowerMonitoringLatestStatusParams = FetchPowerMonitoringKpisParams;
    type FetchOtCommunicationControlKpisParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureKpisParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureEventsOverTimeParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureVerdictDistributionParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureTopRiskySourcesParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureFiltersParams = FetchPowerMonitoringKpisParams;
    type FetchOtSecurityExposureLiveEventsParams = FetchPowerMonitoringKpisParams & {
        limit?: number;
        source?: string;
        destination?: string;
        protocol?: string;
        identity?: string;
        severity?: string;
        verdict?: string;
    };
    type FetchUserManagementUsersParams = {
        kw?: string;
        status?: UserManagementStatusFilter;
        role?: UserManagementRoleFilter;
        limit?: number;
    };
    type FetchOtCommunicationControlFlowParams = FetchPowerMonitoringKpisParams;
    type FetchOtCommunicationControlTopFlowsParams = FetchPowerMonitoringKpisParams & {
        limit?: number;
        source?: string;
        destination?: string;
        protocol?: string;
        severity?: string;
    };
    type FetchOtCommunicationControlSmartloggerTopologyParams = FetchPowerMonitoringKpisParams;
    type FetchOtCommunicationControlModbusResponseTimeParams = FetchPowerMonitoringKpisParams;
    type FetchOtCommunicationControlModbusRequestsErrorsParams = FetchPowerMonitoringKpisParams;
    type FetchOtCommunicationControlModbusUnitHealthParams = FetchPowerMonitoringKpisParams;
    type DashboardTimeRangeQueryParams = {
        timeRange: PowerMonitoringQueryTimeRange;
        customStart: string | null;
        customEnd: string | null;
    };

    type PowerMonitoringKpisResponse = {
        metrics: PowerMetricCard[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringPowerTrendApiPoint = {
        bucket_start: string;
        smartlogger_aggregate: number | null;
        inverter_output: number | null;
        meter_active_power: number | null;
    };

    type PowerMonitoringPowerTrendResponse = {
        points: PowerMonitoringPowerTrendApiPoint[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringEnvironmentalSignalsApiPoint = {
        bucket_start: string;
        irradiance_secondary: number | null;
        module_temperature: number | null;
        active_power: number | null;
        meter_voltage: number | null;
    };

    type PowerMonitoringEnvironmentalSignalsResponse = {
        points: PowerMonitoringEnvironmentalSignalsApiPoint[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringTelemetryProfileApiItem = {
        device_type: string;
        device_count: number;
        signal_count: number;
        reporting_interval_seconds: number | null;
    };

    type PowerMonitoringTelemetryProfileResponse = {
        items: PowerMonitoringTelemetryProfileApiItem[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringReportingCadenceApiPoint = {
        bucket_start: string;
        smartlogger3000: number;
        inverter: number;
        power_meter: number;
        emi: number;
    };

    type PowerMonitoringReportingCadenceResponse = {
        points: PowerMonitoringReportingCadenceApiPoint[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringTelemetryCoverageApiItem = {
        coverage_key: "reportingNormally" | "limitedTelemetry" | "staleOrMissing";
        value: number;
    };

    type PowerMonitoringTelemetryCoverageResponse = {
        items: PowerMonitoringTelemetryCoverageApiItem[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type PowerMonitoringLatestStatusApiRow = {
        device_name: string;
        device_type: string;
        unit_id: number;
        site: string;
        last_seen: string;
        freshness_minutes: number;
        health: "Healthy" | "Watch" | "Limited";
        summary: string;
        active_power: number | null;
        daily_energy: number | null;
        meter_voltage: number | null;
        meter_active_power: number | null;
        irradiance_secondary: number | null;
        module_temperature: number | null;
    };

    type PowerMonitoringLatestStatusResponse = {
        rows: PowerMonitoringLatestStatusApiRow[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationKpiMetricApiItem = {
        id: string;
        title: string;
        value: string;
        helper: string;
        trend_label: string;
        tone: "sky" | "emerald" | "amber" | "violet" | "rose" | "red";
    };

    type OtCommunicationControlKpisResponse = {
        metrics: OtCommunicationKpiMetricApiItem[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtSecurityExposureKpiMetricApiItem = {
        id: string;
        title: string;
        value: string;
        helper: string;
        trend_label: string;
        tone: "sky" | "emerald" | "amber" | "violet" | "rose" | "red";
    };

    type OtSecurityExposureKpisResponse = {
        metrics: OtSecurityExposureKpiMetricApiItem[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtSecurityExposureEventsOverTimeApiRow = {
        bucket_start: string;
        low: number;
        medium: number;
        high: number;
        critical: number;
    };

    type OtSecurityExposureEventsOverTimeResponse = {
        rows: OtSecurityExposureEventsOverTimeApiRow[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtSecurityExposureVerdictDistributionApiRow = {
        bucket_start: string;
        likely_legitimate: number;
        likely_legitimate_unknown_ip: number;
        under_investigation: number;
        likely_attack: number;
    };

    type OtSecurityExposureVerdictDistributionResponse = {
        rows: OtSecurityExposureVerdictDistributionApiRow[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtSecurityExposureTopRiskySourceApiRow = {
        source_ip: string;
        event_count: number;
        avg_risk_score: number;
        max_risk_score: number;
    };

    type OtSecurityExposureTopRiskySourcesResponse = {
        rows: OtSecurityExposureTopRiskySourceApiRow[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtSecurityExposureFiltersResponse = {
        protocols: Filter[];
        severity: Filter[];
        verdict: Filter[];
        identity: Filter[];
    };

    type OtSecurityExposureLiveEventApiRow = {
        id: string;
        event_time: string;
        source_ip: string;
        destination_ip: string;
        source_mac: string | null;
        destination_mac: string | null;
        source_port: number | null;
        destination_port: number | null;
        protocol: string;
        traffic_type: string;
        direction: string;
        classification: string;
        severity: string;
        verdict: string;
        risk_score: number;
        unknown_client: number;
        outside_business_hours: number;
        modbus_disrupted: number;
        message: string;
        raw_message: string;
    };

    type OtSecurityExposureLiveEventsResponse = {
        rows: OtSecurityExposureLiveEventApiRow[];
        total: number;
        page: number;
        per_page: number;
        has_more: boolean;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationFlowApiRow = {
        source: string;
        target: string;
        weight: number;
        highest_severity: DashboardSeverity;
        avg_risk_score: number;
        protocols: string;
        last_seen: string;
    };

    type OtCommunicationControlFlowResponse = {
        rows: OtCommunicationFlowApiRow[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationSmartloggerTopologyApiRow = {
        gateway_host: string;
        smartlogger_ip: string;
        smartlogger_port: number;
        unit_id: number;
        device_type: string;
        device_name: string;
        total_requests: number;
        success_count: number;
        error_count: number;
        slow_count: number;
        success_rate: number;
        avg_response_time_ms: number;
        max_response_time_ms: number;
        protocols: string;
        last_seen: string;
    };

    type OtCommunicationControlSmartloggerTopologyResponse = {
        rows: OtCommunicationSmartloggerTopologyApiRow[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationTopFlowApiRow = {
        source_ip: string;
        destination_ip: string;
        protocol: string;
        port: string;
        direction: string;
        event_count: number;
        unknown_client_events: number;
        unknown_client_rate: number;
        avg_risk_score: number;
        max_risk_score: number;
        highest_severity: DashboardSeverity;
        likely_attack_events: number;
        outside_hours_events: number;
        outside_hours_rate: number;
        modbus_disrupted_events: number;
        modbus_disrupted_rate: number;
        first_seen: string;
        last_seen: string;
    };

    type OtCommunicationControlTopFlowsResponse = {
        rows: OtCommunicationTopFlowApiRow[];
        total: number;
        page: number;
        per_page: number;
        has_more: boolean;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationModbusResponseTimeApiPoint = {
        bucket_start: string;
        unit_id: number;
        avg_response_time_ms: number;
    };

    type OtCommunicationControlModbusResponseTimeResponse = {
        points: OtCommunicationModbusResponseTimeApiPoint[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationModbusRequestsErrorsApiPoint = {
        bucket_start: string;
        total_requests: number;
        total_errors: number;
    };

    type OtCommunicationControlModbusRequestsErrorsResponse = {
        points: OtCommunicationModbusRequestsErrorsApiPoint[];
        bucket_minutes: number;
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type OtCommunicationModbusUnitHealthApiRow = {
        unit_id: number;
        total_requests: number;
        success_count: number;
        error_count: number;
        slow_count: number;
        response_time_avg_ms: number;
        response_time_max_ms: number;
    };

    type OtCommunicationControlModbusUnitHealthResponse = {
        rows: OtCommunicationModbusUnitHealthApiRow[];
        time_range: PowerMonitoringQueryTimeRange;
        custom_start: string | null;
        custom_end: string | null;
        generated_at: string;
    };

    type FetchPortsParams = {
        search?: string;
        status?: string;
        skip?: number;
        limit?: number;
    };

    type DashboardTimeRange = "15m" | "1h" | "6h" | "24h";

    type DashboardSeverity = "low" | "medium" | "high" | "critical";

    type DashboardVerdict =
    | "LIKELY_LEGITIMATE"
    | "LIKELY_LEGITIMATE_UNKNOWN_IP"
    | "UNDER_INVESTIGATION"
    | "LIKELY_ATTACK";

    type DashboardProtocol = "arp" | "tcp" | "udp" | "modbus" | "https" | "tls" | "icmp";

    type DashboardKpiTone = "sky" | "emerald" | "amber" | "violet" | "rose" | "red";

    type DashboardFilterOption = {
        value: string;
        label: string;
    };

    type DashboardFilters = {
        timeRange: DashboardTimeRange;
        severity: "all" | DashboardSeverity;
        verdict: "all" | DashboardVerdict;
        sourceIp: "all" | string;
        destinationIp: "all" | string;
        protocol: "all" | string;
        unitId: "all" | number;
    };

    type DashboardNetworkEvent = {
        id: string;
        timestamp: string;
        sourceIp: string;
        destinationIp: string;
        sourceMac: string | null;
        destinationMac: string | null;
        sourcePort: number | null;
        destinationPort: number | null;
        protocol: DashboardProtocol;
        trafficType: string;
        direction: string;
        classification: string;
        severity: DashboardSeverity;
        verdict: DashboardVerdict;
        riskScore: number;
        unknownClient: boolean;
        outsideBusinessHours: boolean;
        modbusDisrupted: boolean;
        message: string;
        rawLog: string;
    };

    type DashboardModbusSummary = {
        id: string;
        timestamp: string;
        sourceIp: string;
        destinationIp: string;
        unitId: number;
        totalRequests: number;
        successCount: number;
        errorCount: number;
        slowCount: number;
        responseTimeAvgMs: number;
        responseTimeMaxMs: number;
        status: "success" | "degraded";
    };

    type DashboardSessionVerdict = {
        id: string;
        timestamp: string;
        sessionId: string;
        sourceIp: string;
        sessionStart: string;
        sessionEnd: string;
        durationSeconds: number;
        connectionCount: number;
        legitimacyScore: number;
        verdict: DashboardVerdict;
        message: string;
    };

    type DashboardVisibilityLimit = {
        id: string;
        title: string;
        description: string;
        impact: "low" | "medium" | "high";
    };

    type DashboardVisibilityData = {
        networkEvents: DashboardNetworkEvent[];
        modbusSummaries: DashboardModbusSummary[];
        sessionVerdicts: DashboardSessionVerdict[];
        visibilityLimits: DashboardVisibilityLimit[];
    };

    type DashboardKpiCard = {
        id: string;
        title: string;
        value: string;
        helper: string;
        trendLabel: string;
        tone: DashboardKpiTone;
    };

    type DashboardSankeyLinkRow = {
        source: string;
        target: string;
        weight: number;
        highestSeverity: DashboardSeverity;
        avgRiskScore: number;
        protocols: string;
        lastSeen: string;
    };

    type DashboardSmartloggerTopologyRow = {
        gatewayHost: string;
        smartloggerIp: string;
        smartloggerPort: number;
        unitId: number;
        deviceType: string;
        deviceName: string;
        totalRequests: number;
        successCount: number;
        errorCount: number;
        slowCount: number;
        successRate: number;
        avgResponseTimeMs: number;
        maxResponseTimeMs: number;
        protocols: string;
        lastSeen: string;
    };

    type DashboardSeverityTrendRow = {
        bucket: string;
        low: number;
        medium: number;
        high: number;
        critical: number;
    };

    type DashboardVerdictTrendRow = {
        bucket: string;
        LIKELY_LEGITIMATE: number;
        LIKELY_LEGITIMATE_UNKNOWN_IP: number;
        UNDER_INVESTIGATION: number;
        LIKELY_ATTACK: number;
    };

    type DashboardRiskSourceRow = {
        sourceIp: string;
        eventCount: number;
        avgRiskScore: number;
        maxRiskScore: number;
    };

    type DashboardModbusLatencyRow = {
        bucket: string;
        unit0AvgMs: number;
        unit1AvgMs: number;
        unit11AvgMs: number;
        unit100AvgMs: number;
    };

    type DashboardModbusRequestsErrorRow = {
        bucket: string;
        totalRequests: number;
        totalErrors: number;
    };

    type DashboardFlowTableRow = {
        sourceIp: string;
        destinationIp: string;
        protocol: string;
        port: string;
        direction: string;
        eventCount: number;
        unknownClientEvents: number;
        unknownClientRate: number;
        avgRiskScore: number;
        maxRiskScore: number;
        highestSeverity: DashboardSeverity;
        likelyAttackEvents: number;
        outsideHoursEvents: number;
        outsideHoursRate: number;
        modbusDisruptedEvents: number;
        modbusDisruptedRate: number;
        firstSeen: string;
        lastSeen: string;
    };

    type DashboardModbusUnitHealthRow = {
        unitId: number;
        totalRequests: number;
        successCount: number;
        errorCount: number;
        slowCount: number;
        responseTimeAvgMs: number;
        responseTimeMaxMs: number;
    };

    type DashboardFilteredData = {
        networkEvents: DashboardNetworkEvent[];
        modbusSummaries: DashboardModbusSummary[];
        sessionVerdicts: DashboardSessionVerdict[];
    };

    type DashboardInsightTone = "info" | "good" | "warn" | "danger";

    type DashboardInsightItem = {
        id: string;
        title: string;
        detail: string;
        tone: DashboardInsightTone;
    };

    type DashboardPocAlignmentStatus = "strong" | "partial" | "limited";

    type DashboardPocAlignmentRow = {
        id: string;
        deliverable: string;
        status: DashboardPocAlignmentStatus;
        evidence: string;
    };

}

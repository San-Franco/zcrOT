import type { IconType } from "react-icons";
import { IoIosTrendingDown } from "react-icons/io";
import {
    LuCircleCheck,
    LuCircleOff,
    LuCrown,
    LuFolderOpen,
    LuGlobe,
    LuHeartPulse,
    LuLock,
    LuSearch,
    LuShieldCheck,
    LuShieldQuestion,
    LuShieldX,
    LuTriangleAlert,
    LuUserCheck,
    LuUserX
} from "react-icons/lu";
import { MdDoneAll, MdOutlinePersonOutline } from "react-icons/md";
import { PiEyesFill, PiSealCheck, PiSpinnerGapLight } from "react-icons/pi";
import { TbProgressCheck } from "react-icons/tb";
import { Badge } from "../ui/badge";

interface BadgeConfig {
    icon: IconType | null;
    label: string;
    className: string;
}

const DEFAULT_BADGE_CLASSNAME = 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400';
type CustomBadgeKind = "status" | "severity" | "verdict" | "identity";

const formatBadgeLabel = (value?: string | null): string => {
    if (!value) {
        return 'Unknown';
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const STATUS_BADGE_CONFIGS: Record<string, BadgeConfig> = {
    'ADMIN': {
        icon: LuCrown,
        label: 'Admin',
        className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    },
    'VIEWER': {
        icon: MdOutlinePersonOutline,
        label: 'Viewer',
        className: 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400'
    },
    'ACTIVE': {
        icon: TbProgressCheck,
        label: 'Active',
        className: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
    },
    'INACTIVE': {
        icon: LuCircleOff,
        label: 'Inactive',
        className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400'
    },
    'LOCKED': {
        icon: LuLock,
        label: 'Locked',
        className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    },
    'PENDING_VERIFICATION': {
        icon: PiSpinnerGapLight,
        label: 'Pending verification',
        className: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-300'
    },
    'LIMITED': {
        icon: LuLock,
        label: 'Limited',
        className: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
    },
    'HEALTHY': {
        icon: LuHeartPulse,
        label: 'Healthy',
        className: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
    },
    'WATCH': {
        icon: PiEyesFill,
        label: 'Watch',
        className: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
    },
    'DEGRADED': {
        icon: IoIosTrendingDown,
        label: 'Degraded',
        className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400'
    },
    'PRIMARY': {
        icon: PiSealCheck,
        label: 'Primary',
        className: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
    },
    'CLOSED': {
        icon: MdDoneAll,
        label: 'Closed',
        className: 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400'
    },
    'OPEN': {
        icon: LuFolderOpen,
        label: 'Open',
        className: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400'
    },
    'ACKNOWLEDGE': {
        icon: MdDoneAll,
        label: 'ACK',
        className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    },
    'ACK': {
        icon: MdDoneAll,
        label: 'ACK',
        className: 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
    },
};

const SEVERITY_BADGE_CONFIGS: Record<string, BadgeConfig> = {
    'LOW': {
        icon: LuCircleCheck,
        label: 'Low',
        className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    },
    'MEDIUM': {
        icon: LuTriangleAlert,
        label: 'Medium',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    },
    'HIGH': {
        icon: LuTriangleAlert,
        label: 'High',
        className: 'border-orange-500/40 bg-orange-500/12 text-orange-300'
    },
    'CRITICAL': {
        icon: LuShieldX,
        label: 'Critical',
        className: 'border-red-500/45 bg-red-500/14 text-red-300'
    },
};

const VERDICT_BADGE_CONFIGS: Record<string, BadgeConfig> = {
    'LIKELY_LEGITIMATE': {
        icon: LuShieldCheck,
        label: 'Likely legitimate',
        className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    },
    'LIKELY_LEGITIMATE_UNKNOWN_IP': {
        icon: LuShieldQuestion,
        label: 'Legitimate (unknown IP)',
        className: 'border-teal-500/40 bg-teal-500/10 text-teal-300'
    },
    'UNDER_INVESTIGATION': {
        icon: LuSearch,
        label: 'Under investigation',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    },
    'LIKELY_ATTACK': {
        icon: LuShieldX,
        label: 'Likely attack',
        className: 'border-red-500/45 bg-red-500/14 text-red-300'
    },
};

const IDENTITY_BADGE_CONFIGS: Record<string, BadgeConfig> = {
    'KNOWN': {
        icon: LuUserCheck,
        label: 'Known',
        className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    },
    'UNKNOWN': {
        icon: LuUserX,
        label: 'Unknown',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    },
    'EXTERNAL': {
        icon: LuGlobe,
        label: 'External',
        className: 'border-sky-500/40 bg-sky-500/10 text-sky-300'
    },
};

const getBadgeConfig = (value?: string | null, kind: CustomBadgeKind = "status"): BadgeConfig => {
    const normalizedValue = value?.toUpperCase();
    const lookupByKind: Record<CustomBadgeKind, Record<string, BadgeConfig>> = {
        status: STATUS_BADGE_CONFIGS,
        severity: SEVERITY_BADGE_CONFIGS,
        verdict: VERDICT_BADGE_CONFIGS,
        identity: IDENTITY_BADGE_CONFIGS,
    };
    const configs = lookupByKind[kind];

    if (normalizedValue && configs[normalizedValue]) {
        return configs[normalizedValue];
    }

    return {
        icon: null,
        label: formatBadgeLabel(value),
        className: DEFAULT_BADGE_CLASSNAME
    };
};

export default function CustomBadge({
    value,
    kind = "status",
}: {
    value?: string | null;
    kind?: CustomBadgeKind;
}) {
    const config = getBadgeConfig(value, kind);
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={`flex items-center rounded-md gap-1.5 w-fit whitespace-nowrap ${config.className}`}
        >
            {Icon ? <Icon className="size-3.5" /> : null}
            <span className="text-xs font-medium">{config.label}</span>
        </Badge>
    );
}

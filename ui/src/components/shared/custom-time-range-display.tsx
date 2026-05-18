import { X } from "lucide-react"
import { useSearchParams } from "react-router";

interface Props {
    customStart: string | null,
    customEnd: string | null,
    isDisabled?: boolean
}

function formatShortDate(dateString: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date(dateString));
}

export default function CustomTimeRangeDisplay({ customStart, customEnd, isDisabled }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleClearCustomRange = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("customStart");
        nextParams.delete("customEnd");
        if (!nextParams.get("timeRange")) {
            nextParams.set("timeRange", "1h");
        }
        setSearchParams(nextParams);
    };
    return (
        customStart && customEnd && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg w-fit text-zcr-blue bg-linear-to-br from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20 backdrop-blur-sm">
                <span>
                    {formatShortDate(customStart)} - {formatShortDate(customEnd)}
                </span>
                <button
                    disabled={isDisabled}
                    onClick={handleClearCustomRange}
                    className="p-1 text-white transition-colors rounded-md cursor-pointer hover:bg-muted"
                    title="Clear custom range"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    )
}

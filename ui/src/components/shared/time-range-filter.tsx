import { DASHBOARD_TIME_RANGES } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useSearchParams } from "react-router"

export default function TimeRangeFilter({ filters = DASHBOARD_TIME_RANGES, isDisabled }: { filters?: Filter[], isDisabled?: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams()
    const timeRangeValue = searchParams.get("timeRange") || filters[0].value
    const customValue = searchParams.get("customStart")
    const paramsFilter = customValue ? "" : timeRangeValue

    const handleUpdateParams = (value: string) => {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set("timeRange", value)
        nextParams.delete("customStart")
        nextParams.delete("customEnd")
        setSearchParams(nextParams)
    }

    return (
        <div className="p-1.25 w-fit border primary-gradient shadow-sm border-slate-700 rounded-lg flex-center gap-2">
            {
                filters.map(filter => (
                    <button
                        key={filter.name}
                        disabled={(filter.value === paramsFilter) || isDisabled}
                        onClick={() => handleUpdateParams(filter.value)}
                        type="button"
                        className={cn(paramsFilter === filter.value ? "bg-gradient hover:text-white" : "hover:bg-zcr-blue/10 hover:text-zcr-blue", "px-2 sm:px-4 py-0.5 sm:py-1 disabled:cursor-not-allowed cursor-pointer text-sm font-normal rounded-sm transition-colors",)}
                    >
                        {filter.name}
                    </button>
                ))
            }
        </div>
    )
}

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import * as React from "react";
import { type DateRange } from "react-day-picker";
import { FiAlertCircle, FiCalendar } from "react-icons/fi";
import { useSearchParams } from "react-router";

const QUICK_RANGES = [
    { days: 7, key: "7d", label: "Last 7" },
    { days: 30, key: "30d", label: "Last 30" },
    { days: 90, key: "90d", label: "Last 90" },
    { days: 120, key: "120d", label: "Last 120" },
];

const CustomTimeRangeModal = ({ onClose }: { onClose: () => void }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const getDefaultDateRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { from: start, to: end };
    };

    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(getDefaultDateRange());
    const [selectedQuick, setSelectedQuick] = React.useState<string>("7d");

    const handleQuickSelect = (days: number, key: string) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setDateRange({ from: start, to: end });
        setSelectedQuick(key);
    };

    const handleApply = () => {
        if (dateRange?.from && dateRange?.to) {
            // Format to ISO with Bangkok timezone offset (+07:00)
            const formatToBangkokISO = (date: Date) => {
                // Ensure we're working with Bangkok time
                const bangkokOffset = 7 * 60; // Bangkok is UTC+7
                const localOffset = date.getTimezoneOffset(); // Local offset in minutes (negative for ahead of UTC)
                const offsetDiff = bangkokOffset + localOffset;

                // Adjust date to Bangkok time if needed
                const bangkokDate = new Date(date.getTime() + offsetDiff * 60 * 1000);

                // Format as ISO but with Bangkok timezone
                const year = bangkokDate.getFullYear();
                const month = String(bangkokDate.getMonth() + 1).padStart(2, '0');
                const day = String(bangkokDate.getDate()).padStart(2, '0');
                const hours = String(bangkokDate.getHours()).padStart(2, '0');
                const minutes = String(bangkokDate.getMinutes()).padStart(2, '0');

                // Return ISO format with Bangkok timezone
                return `${year}-${month}-${day}T${hours}:${minutes}:00+07:00`;
            };

            searchParams.delete("timeRange");
            searchParams.set("customStart", formatToBangkokISO(dateRange.from));
            searchParams.set("customEnd", formatToBangkokISO(dateRange.to));
            setSearchParams(searchParams);

            onClose();
        }
    };

    const handleCalendarSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        setSelectedQuick("");
    };

    const isApplyDisabled = !dateRange?.from || !dateRange?.to;

    const formatDisplayDate = (date: Date | undefined) => {
        if (!date) return "";
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getDuration = () => {
        if (!dateRange?.from || !dateRange?.to) return "";
        const diff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        return `${diff} day${diff !== 1 ? "s" : ""}`;
    };

    return (
        <DialogContent className="max-h-[90vh] sm:max-w-150 no-scrollbar overflow-y-auto bg-linear-to-b from-logo-two/20 via-logo-three/15 to-logo-four/18 z-999">
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center mt-1 rounded-lg size-10 sm:size-11 bg-zcr-blue/10">
                        <FiCalendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <DialogTitle className="text-base font-semibold sm:text-lg">Custom Time Range</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                            Select a custom UTC date window for OT telemetry fetch.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="p-4 border rounded-lg base-gradient">
                <div className="flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">Query Limitations</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                            Maximum range: 120 days. Custom queries may take longer to process.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 border rounded-lg bg-dark-surface">
                <h3 className="mb-4 text-lg font-semibold">Select Date Range</h3>

                <div className="flex justify-center mb-6">
                    <Calendar
                        disabled={(date) => date > new Date()}
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleCalendarSelect}
                        numberOfMonths={2}
                        className="w-full border rounded-lg shadow-sm primary-gradient"
                    />
                </div>

                {dateRange?.from && dateRange?.to && (
                    <div className="p-4 border green-gradient">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h4 className="text-sm font-medium text-green-900 dark:text-green-300">Selected Range (UTC)</h4>
                        </div>
                        <div className="space-y-1 text-sm text-green-800 dark:text-green-400">
                            <p>From: {formatDisplayDate(dateRange.from)}</p>
                            <p>To: {formatDisplayDate(dateRange.to)}</p>
                            <p>Duration: {getDuration()}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 md:items-center md:flex-row">
                <span className="text-sm font-medium text-muted-foreground">Quick:</span>
                <div className="flex flex-wrap gap-2">
                    {QUICK_RANGES.map((range) => (
                        <Button
                            key={range.key}
                            variant="outline"
                            size="sm"
                            className={cn(selectedQuick === range.key ? "bg-gradient" : "", "border-none cursor-pointer")}
                            onClick={() => handleQuickSelect(range.days, range.key)}
                        >
                            <span className="hidden sm:inline">{range.label} days</span>
                            <span className="sm:hidden">{range.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
                <DialogClose asChild>
                    <Button
                        variant="outline"
                        className="cursor-pointer w-fit min-h-11"
                    >
                        Cancel
                    </Button>
                </DialogClose>
                <Button
                    onClick={handleApply}
                    disabled={isApplyDisabled}
                    className="text-white cursor-pointer min-h-11 bg-gradient hover:brightness-110"
                >
                    Apply Time Range
                </Button>
            </DialogFooter>
        </DialogContent>
    );
};

export default CustomTimeRangeModal;

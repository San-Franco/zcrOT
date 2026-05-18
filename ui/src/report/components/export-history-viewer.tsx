import Empty from "@/components/shared/empty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { formatReportDate } from "../utils/date-utils";
import {
  deleteExportHistoryEntry,
  getExportHistory,
  getExportHistoryGroupedByDate,
  type ExportHistoryEntry,
} from "../utils/export-history-service";

interface ExportHistoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportHistoryViewer({ isOpen, onClose }: ExportHistoryViewerProps) {
  const [entries, setEntries] = useState<ExportHistoryEntry[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<Record<string, ExportHistoryEntry[]>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const allEntries = getExportHistory();
    setEntries(allEntries);
    setGroupedEntries(getExportHistoryGroupedByDate());
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteExportHistoryEntry(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setGroupedEntries(getExportHistoryGroupedByDate());
  };

  const formatExportTime = (isoString: string) => format(parseISO(isoString), "HH:mm:ss");

  const formatDateRange = (start: string, end: string) =>
    `${formatReportDate(start, "MMM dd, yyyy")} - ${formatReportDate(end, "MMM dd, yyyy")}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="z-999 max-h-[82vh] overflow-hidden border-dark-border/50 bg-linear-to-b from-dark-surface via-dark-surface/95 to-dark-bg sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export History</DialogTitle>
          <DialogDescription>
            View your latest report exports and remove outdated entries.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {entries.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center py-8">
              <Empty
                label="No Export History Yet"
                description="Your report export history will appear here."
                classesName="h-[130px] w-[170px]"
              />
            </div>
          ) : (
            <div className="space-y-6 px-1">
              {Object.entries(groupedEntries).map(([date, dayEntries]) => (
                <section key={date} className="space-y-3">
                  <header className="border-b border-dark-border/50 pb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      {date}
                    </h3>
                  </header>

                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
                      <article
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-lg border border-dark-border/50 bg-dark-surface/65 p-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{entry.format.toUpperCase()}</span>
                            <span
                              className={
                                entry.reportPeriod.type === "monthly"
                                  ? "rounded px-2 py-0.5 text-[11px] font-medium text-blue-300 bg-blue-500/15"
                                  : "rounded px-2 py-0.5 text-[11px] font-medium text-violet-300 bg-violet-500/15"
                              }
                            >
                              {entry.reportPeriod.type}
                            </span>
                          </div>

                          <p className="text-xs text-foreground/90">
                            {formatDateRange(entry.reportPeriod.startDate, entry.reportPeriod.endDate)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/85">User:</span> {entry.exportedBy}
                            <span className="mx-1">•</span>
                            <span className="font-medium text-foreground/85">Time:</span> {formatExportTime(entry.exportedAt)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Delete
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-dark-border/50 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer min-h-10">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


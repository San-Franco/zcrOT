/* ── Report Generator — main page component ── */
import Empty from '@/components/shared/empty';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { format, subMonths, subWeeks } from 'date-fns';
import { FileDown, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { ExportHistoryViewer } from './components/export-history-viewer';
import { exportToDocx } from './components/export/docx-exporter';
import { exportToPdf } from './components/export/pdf-exporter';
import { useAiInsights } from './hooks/use-ai-insights';
import { useReportData } from './hooks/use-report-data';
import { REPORT_SECTIONS } from './constants';
import type { ReportType, SectionId } from './types';
import { toDateTimeLocalInput, toReportDateRange } from './utils/date-utils';
import { buildSectionAiEvidence, deriveReportMetrics } from './utils/report-derivations';

import AlertsAndRiskFindings from './components/sections/alerts-and-risk-findings';
import AssetVisibilitySummary from './components/sections/asset-visibility-summary';
import CommunicationOverview from './components/sections/communication-overview';
import ConclusionAndNextSteps from './components/sections/conclusion-and-next-steps';
import CoverPage from './components/sections/cover-page';
import DetectionRuleSummary from './components/sections/detection-rule-summary';
import EnvironmentOverview from './components/sections/environment-overview';
import ExecutiveSummary from './components/sections/executive-summary';
import RiskAssessmentReport from './components/sections/risk-assessment-report';
import TableOfContents from './components/sections/table-of-contents';

import { BsFiletypeDocx } from 'react-icons/bs';
import { VscFilePdf } from 'react-icons/vsc';
import './styles/report.css';
import useTitle from '@/hooks/system/use-title';

export default function ReportPage() {
  useTitle("Report Generator")

  const reportRef = useRef<HTMLDivElement>(null!);
  const forceRegenInsights = useRef(false);
  const wasGeneratingRef = useRef(false);
  const { data, isLoading, error, generateReport, failedEndpoints, restoreLastReport, cacheInsightsForCurrentReport, getCachedInsights } = useReportData();
  const { insights, isGenerating, progress, total, setInsights, generateAllInsights, clearAll } = useAiInsights();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const now = new Date();
  const defaultEnd = format(now, "yyyy-MM-dd'T'HH:mm");
  const defaultStart = format(reportType === 'monthly' ? subMonths(now, 1) : subWeeks(now, 1), "yyyy-MM-dd'T'HH:mm");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [isExporting, setIsExporting] = useState(false);
  const [hasGeneratedBefore, setHasGeneratedBefore] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(defaultStart),
    to: new Date(defaultEnd),
  });
  const reportErrorMessage = error
    ? typeof error === "string"
      ? error
      : "Unable to load report data. Please try again."
    : "Unable to load report data. Please try again.";
  const generatingProgressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;
  const reportMetrics = useMemo(() => (data ? deriveReportMetrics(data) : null), [data]);

  // Restore cached report on component mount
  useEffect(() => {
    const lastReport = restoreLastReport();
    if (lastReport) {
      // Restore the dates that were used for the cached report
      setReportType(lastReport.type);
      setStartDate(toDateTimeLocalInput(lastReport.startDate));
      setEndDate(toDateTimeLocalInput(lastReport.endDate));
    }
  }, [restoreLastReport]);

  // Cache insights when they're all generated
  useEffect(() => {
    if (data && !isGenerating && insights['executive-summary'] && Object.keys(insights).length > 0) {
      cacheInsightsForCurrentReport(insights);
    }
  }, [insights, isGenerating, data, cacheInsightsForCurrentReport]);

  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
      return;
    }

    if (wasGeneratingRef.current && total > 0 && progress >= total) {
      toast.success("Success", {
        description: "AI insights generated successfully."
      });
    }

    wasGeneratingRef.current = false;
  }, [isGenerating, progress, total]);

  // Restore cached insights if available, otherwise generate them
  useEffect(() => {
    if (data && reportMetrics && !isGenerating && !insights['executive-summary']) {
      const shouldForce = forceRegenInsights.current;
      if (shouldForce) forceRegenInsights.current = false;

      const cachedInsights = !shouldForce ? getCachedInsights() : null;
      if (cachedInsights && Object.keys(cachedInsights).length > 0) {
        setInsights(cachedInsights);
      } else {
        const sections = REPORT_SECTIONS.filter(s => s.number > 0).map(s => ({
          id: s.id as SectionId,
          title: s.title,
          data: buildSectionAiEvidence(
            s.id as SectionId,
            reportMetrics.aiEvidence,
            reportMetrics,
          ),
        }));
        void generateAllInsights(sections);
      }
    }
  }, [data, reportMetrics, isGenerating, insights, getCachedInsights, setInsights, generateAllInsights]);

  const handleGenerate = () => {
    forceRegenInsights.current = true;
    clearAll();
    setHasGeneratedBefore(true);
    const { start, end } = toReportDateRange(startDate, endDate);
    generateReport(start, end, reportType, true);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setStartDate(format(range.from, "yyyy-MM-dd'T'HH:mm"));
    }
    if (range?.to) {
      setEndDate(format(range.to, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handleTypeChange = (t: ReportType) => {
    setReportType(t);
    const end = new Date();
    const start = t === 'monthly' ? subMonths(end, 1) : subWeeks(end, 1);
    setEndDate(format(end, "yyyy-MM-dd'T'HH:mm"));
    setStartDate(format(start, "yyyy-MM-dd'T'HH:mm"));
    setDateRange({ from: start, to: end });
  };

  const handleExportPdf = async () => {
    if (!data || !reportRef.current) return;
    setIsExporting(true);
    const { start, end } = toReportDateRange(startDate, endDate);
    try {
      await exportToPdf({
        reportElement: reportRef.current,
        reportType,
        startDate: start,
        endDate: end,
        filename: `OT-Report-${format(new Date(endDate), 'yyyy-MM-dd')}.pdf`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      await exportToDocx(data, insights, `OT-Report-${format(new Date(endDate), 'yyyy-MM-dd')}.docx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-workspace space-y-4">
      <ExportHistoryViewer isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} />

      {/* Toolbar */}
      <div className="report-no-print report-generator-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '18pt', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Report Generator</h1>
            <p style={{ fontSize: '9pt', color: '#94a3b8', margin: '4px 0 0' }}>Generate comprehensive OT visibility & security reports</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['monthly', 'weekly'] as const).map(t => (
              <button key={t} onClick={() => handleTypeChange(t)} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid', fontSize: '9pt', fontWeight: 600, cursor: 'pointer', borderColor: reportType === t ? '#2f80ed' : 'rgba(255,255,255,.2)', background: reportType === t ? '#2f80ed' : 'transparent', color: reportType === t ? '#fff' : '#94a3b8' }}>
                {t === 'monthly' ? 'Monthly' : 'Weekly'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'end', gap: '16px', marginTop: '16px', flexWrap: 'wrap', position: 'relative' }}>
          {/* Calendar Date Range Picker */}
          <div>
            <label style={{ fontSize: '8pt', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date Range</label>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,.2)',
                background: 'rgba(255,255,255,.05)',
                color: '#e2e8f0',
                fontSize: '9pt',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: '280px'
              }}
            >
              {dateRange?.from && dateRange?.to ? (
                <span>{format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}</span>
              ) : (
                <span>Select date range...</span>
              )}
            </button>

            {/* Calendar Popup */}
            {isCalendarOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1200
                  }}
                  onClick={() => setIsCalendarOpen(false)}
                />
                <Card style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  zIndex: 1201,
                  background: 'rgba(30, 41, 59, 0.98)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
                }}>
                  <CardContent className="p-0">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleCalendarSelect}
                      numberOfMonths={2}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      className="bg-transparent"
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <button onClick={handleGenerate} disabled={isLoading} style={{ padding: '8px 24px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg,#2f80ed,#4c3390)', color: '#fff', fontSize: '10pt', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? .6 : 1 }}>
            {isLoading ? 'Generating…' : hasGeneratedBefore ? 'Re-generate Report' : 'Generate Report'}
          </button>

          {data && <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' disabled={isExporting} style={{
                  padding: '8px 30px',
                  borderRadius: '6px',
                  fontSize: '9pt',
                  fontWeight: 600,
                  cursor: isExporting ? 'not-allowed' : 'pointer'
                }}>
                  <FileDown style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start' className='w-24 bg-dark-surface'>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>
                    <VscFilePdf />
                    As PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportDocx} disabled={isExporting}>
                    <BsFiletypeDocx />
                    As DOCX
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              disabled={isExporting}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #8b5cf6',
                background: 'transparent',
                color: '#a78bfa',
                fontSize: '9pt',
                fontWeight: 600,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
              title='History'
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v5h5" />
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                <path d="M12 7v5l4 2" />
              </svg>
            </button>
          </>}
        </div>
      </div>

      {error && (
        <div className="report-state-card">
          <Empty
            label="Unable To Load Report"
            description={reportErrorMessage}
            classesName="h-[140px] w-[180px]"
            lottie="fail"
          />
        </div>
      )}

      {failedEndpoints.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#d97706', fontSize: '9pt' }}>
          ⚠️ Some data sources failed to load: {failedEndpoints.join(', ')}. Affected report sections may show incomplete data.
        </div>
      )}

      <Dialog open={isGenerating && total > 0}>
        <DialogContent
          showCloseButton={false}
          className="report-generating-modal z-999 gap-5 border-dark-border/60 p-0 sm:max-w-2xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="relative z-10 space-y-5 px-7 py-6">
            <div className="pointer-events-none absolute -top-10 right-6 size-36 rounded-full bg-zcr-blue/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 size-32 rounded-full bg-logo-three/10 blur-3xl" />

            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-zcr-blue/35 bg-zcr-blue/10 px-2.5 py-1 text-[11px] font-medium text-blue-300">
                    <Sparkles className="size-3.5" />
                    AI Insight Engine
                  </span>
                  <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                    Generating AI Insights
                  </DialogTitle>
                </div>
                <span className="rounded-md bg-zcr-blue/15 px-2 py-1 text-xs font-semibold text-blue-300">
                  {generatingProgressPercent}%
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Building contextual insights from telemetry, detections, and risk signals.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-yellow-500/30 bg-linear-to-r from-yellow-500/14 via-yellow-500/8 to-transparent px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-yellow-200">
                Keep This Window Open
              </p>
              <p className="mt-1 text-xs leading-5 text-yellow-100/85">
                Insight generation may take a little longer for large date ranges or heavier report data.
              </p>
            </div>

            <div className="space-y-3">
              <Progress
                value={generatingProgressPercent}
                className="h-2 bg-zcr-blue/15"
                indicatorClassName="bg-gradient shimmer-effect"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground/90">{progress} of {total} sections complete</p>
                <p>{Math.max(total - progress, 0)} remaining</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview */}
      {data && reportMetrics && (
        <div className="report-result-card">
          <div ref={reportRef} className="report-container">
            <CoverPage config={data.config} />
            <TableOfContents />
            <ExecutiveSummary metrics={reportMetrics} insight={insights['executive-summary']} />
            <EnvironmentOverview metrics={reportMetrics} insight={insights['environment-overview']} />
            <AssetVisibilitySummary metrics={reportMetrics} insight={insights['asset-visibility-summary']} />
            <CommunicationOverview metrics={reportMetrics} insight={insights['communication-overview']} />
            <AlertsAndRiskFindings metrics={reportMetrics} insight={insights['alerts-and-risk-findings']} />
            <DetectionRuleSummary metrics={reportMetrics} insight={insights['detection-rule-summary']} />
            <RiskAssessmentReport metrics={reportMetrics} insight={insights['risk-assessment-report']} />
            <ConclusionAndNextSteps metrics={reportMetrics} insight={insights['conclusion-and-next-steps']} />
          </div>
        </div>
      )}

      {!data && !isLoading && (
        <div className="report-state-card">
          <Empty
            label="No Report Generated Yet"
            description='Select a date range and click "Generate Report" to create your OT security report.'
            classesName="h-[140px] w-[180px]"
          />
        </div>
      )}
    </div>
  );
}

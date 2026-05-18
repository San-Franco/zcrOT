import reportStyles from '../../styles/report.css?raw';
import { addExportHistory } from '../../utils/export-history-service';

interface PdfExportOptions {
  reportElement: HTMLElement;
  reportType?: 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
  filename?: string;
}

function cloneCanvasContent(sourceRoot: HTMLElement, targetRoot: HTMLElement): void {
  const sourceCanvases = Array.from(sourceRoot.querySelectorAll('canvas'));
  const targetCanvases = Array.from(targetRoot.querySelectorAll('canvas'));

  sourceCanvases.forEach((sourceCanvas, index) => {
    const targetCanvas = targetCanvases[index];
    if (!targetCanvas) return;

    const context = targetCanvas.getContext('2d');
    if (!context) return;

    targetCanvas.width = sourceCanvas.width;
    targetCanvas.height = sourceCanvas.height;
    context.drawImage(sourceCanvas, 0, 0);
  });
}

function getPixelSize(element: HTMLElement, property: string): number {
  const view = element.ownerDocument.defaultView;
  if (!view) return 0;
  const value = view.getComputedStyle(element).getPropertyValue(property);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ensurePageFitWrapper(page: HTMLElement): HTMLElement {
  const existing = page.querySelector(':scope > .report-page-fit') as HTMLElement | null;
  if (existing) return existing;

  const wrapper = page.ownerDocument.createElement('div');
  wrapper.className = 'report-page-fit';

  while (page.firstChild) {
    wrapper.appendChild(page.firstChild);
  }

  page.appendChild(wrapper);
  return wrapper;
}

function fitPagesToA4(documentRoot: Document): void {
  const pages = Array.from(documentRoot.querySelectorAll<HTMLElement>('.report-page'));

  pages.forEach((page) => {
    const wrapper = ensurePageFitWrapper(page);
    wrapper.style.transform = '';
    wrapper.style.width = '100%';

    const availableWidth = page.clientWidth - getPixelSize(page, 'padding-left') - getPixelSize(page, 'padding-right');
    const availableHeight = page.clientHeight - getPixelSize(page, 'padding-top') - getPixelSize(page, 'padding-bottom');
    const naturalWidth = Math.max(wrapper.scrollWidth, Math.ceil(wrapper.getBoundingClientRect().width));
    const naturalHeight = Math.max(wrapper.scrollHeight, Math.ceil(wrapper.getBoundingClientRect().height));

    const widthScale = naturalWidth > 0 ? availableWidth / naturalWidth : 1;
    const heightScale = naturalHeight > 0 ? availableHeight / naturalHeight : 1;
    let scale = Math.min(widthScale, heightScale, 1);

    if (scale < 0.995) {
      scale = Math.max(scale - 0.01, 0.78);
      wrapper.style.width = `${100 / scale}%`;
      wrapper.style.transform = `scale(${scale})`;
      page.classList.add('report-page--scaled');
      page.dataset.exportScale = scale.toFixed(3);
    } else {
      page.classList.remove('report-page--scaled');
      delete page.dataset.exportScale;
    }
  });
}

function buildPrintHtml(title: string): string {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>${reportStyles}</style>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #f1f5f9;
          }

          .report-print-root {
            padding: 24px;
            background: #f1f5f9;
          }

          body.report-export-mode .report-page-fit {
            width: 100%;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            transform-origin: top left;
          }

          body.report-export-mode .report-page {
            font-size: 9.2pt;
            line-height: 1.5;
          }

          body.report-export-mode .report-section-header {
            margin-bottom: 1.15rem;
          }

          body.report-export-mode .report-section-title {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
          }

          body.report-export-mode .report-story-block,
          body.report-export-mode .report-kpi-grid,
          body.report-export-mode .report-stat-strip,
          body.report-export-mode .report-chart-row,
          body.report-export-mode .report-summary-split,
          body.report-export-mode .report-two-col {
            margin-bottom: 0;
            gap: 1rem;
          }

          body.report-export-mode .report-evidence-content {
            gap: 1rem;
          }

          body.report-export-mode .report-summary-block,
          body.report-export-mode .report-recommendation-block,
          body.report-export-mode .report-evidence-panel,
          body.report-export-mode .report-highlight-panel,
          body.report-export-mode .report-chart-col,
          body.report-export-mode .report-highlight-box,
          body.report-export-mode .report-action-card {
            padding: 1rem 1.1rem;
          }

          body.report-export-mode .report-kpi-grid {
            gap: 1rem;
            margin-bottom: 1.25rem;
          }

          body.report-export-mode .report-kpi-value {
            font-size: 2rem;
          }

          body.report-export-mode .report-panel-title,
          body.report-export-mode .report-chart-title,
          body.report-export-mode .report-block-title,
          body.report-export-mode .report-technical-details-header {
            margin-bottom: 0.75rem;
            font-size: 0.98rem;
          }

          body.report-export-mode .report-highlight-list,
          body.report-export-mode .report-summary-text,
          body.report-export-mode .report-recommendation-text {
            font-size: 0.9rem;
            line-height: 1.5;
          }

          body.report-export-mode .report-table {
            font-size: 0.78rem;
          }

          body.report-export-mode .report-table th,
          body.report-export-mode .report-table td {
            padding: 0.55rem 0.7rem;
          }

          body.report-export-mode .report-chart-col .report-chart-container > div:last-child {
            height: 165px !important;
          }

          body.report-export-mode .report-stat-strip {
            padding: 1rem;
          }

          body.report-export-mode .report-stat-number {
            font-size: 1.9rem;
          }

          body.report-export-mode .report-key-value-table {
            font-size: 0.85rem;
          }

          body.report-export-mode .report-cover-title {
            font-size: 2.6rem;
            margin-bottom: 2rem;
          }

          body.report-export-mode .report-cover-subtitle {
            margin-bottom: 1.75rem;
            font-size: 1rem;
          }

          body.report-export-mode .report-cover-details {
            gap: 0.75rem;
          }

          body.report-export-mode .report-cover-detail-row {
            font-size: 1rem;
          }

          body.report-export-mode .report-footer {
            padding-top: 3mm;
            font-size: 0.7rem;
          }

          @media print {
            html, body {
              background: #ffffff !important;
            }

            .report-print-root {
              padding: 0 !important;
              background: transparent !important;
            }
          }
        </style>
      </head>
      <body class="report-export-mode">
        <div class="report-print-root"></div>
      </body>
    </html>
  `;
}

export async function exportToPdf({
  reportElement,
  reportType,
  startDate,
  endDate,
  filename = 'OT-Report.pdf',
}: PdfExportOptions): Promise<void> {
  if (!reportElement) {
    throw new Error('Report container not found.');
  }

  if (reportType && startDate && endDate) {
    addExportHistory('pdf', reportType, startDate, endDate);
  }

  const sourcePages = Array.from(reportElement.querySelectorAll<HTMLElement>('.report-page'));
  if (sourcePages.length === 0) {
    throw new Error('No report pages found to export.');
  }

  const clonedRoot = reportElement.cloneNode(true) as HTMLElement;
  cloneCanvasContent(reportElement, clonedRoot);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  try {
    const printDocument = iframe.contentDocument;
    const printWindow = iframe.contentWindow;
    if (!printDocument || !printWindow) {
      throw new Error('Failed to create print document.');
    }

    printDocument.open();
    printDocument.write(buildPrintHtml(filename));
    printDocument.close();

    const mountPoint = printDocument.querySelector('.report-print-root');
    if (!mountPoint) {
      throw new Error('Failed to mount print report.');
    }

    const importedRoot = printDocument.importNode(clonedRoot, true) as HTMLElement;
    cloneCanvasContent(clonedRoot, importedRoot);
    mountPoint.appendChild(importedRoot);

    await new Promise<void>((resolve) => {
      printWindow.requestAnimationFrame(() => {
        printWindow.requestAnimationFrame(() => resolve());
      });
    });

    if ('fonts' in printDocument) {
      await printDocument.fonts.ready;
    }

    fitPagesToA4(printDocument);

    await new Promise<void>((resolve) => {
      printWindow.requestAnimationFrame(() => {
        printWindow.requestAnimationFrame(() => resolve());
      });
    });

    await new Promise<void>((resolve) => {
      const cleanup = () => {
        printWindow.removeEventListener('afterprint', cleanup);
        resolve();
      };

      printWindow.addEventListener('afterprint', cleanup);
      printWindow.focus();
      printWindow.print();

      window.setTimeout(() => {
        printWindow.removeEventListener('afterprint', cleanup);
        resolve();
      }, 30000);
    });
  } finally {
    document.body.removeChild(iframe);
  }
}

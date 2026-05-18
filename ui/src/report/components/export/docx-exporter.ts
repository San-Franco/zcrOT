import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
  HeadingLevel,
} from 'docx';
import { format } from 'date-fns';
import type { ReportData } from '../../types';
import { addExportHistory } from '../../utils/export-history-service';
import { buildExportContent, type ExportBlock, type InsightMap } from './export-content';

const FONT = 'Calibri';

// Color Palette - Professional & Clean
const COLORS = {
  primary: '2563EB', // Blue 600
  primaryLight: '3B82F6', // Blue 500
  accent: '7C3AED', // Violet 600
  textDark: '1E293B', // Slate 800
  textMedium: '475569', // Slate 600
  textLight: '64748B', // Slate 500
  border: 'E2E8F0', // Slate 200
  bgLight: 'F8FAFC', // Slate 50
  success: '059669', // Emerald 600
  warning: 'D97706', // Amber 600
  danger: 'DC2626', // Red 600
  white: 'FFFFFF',
};

// Spacing constants (in twips - 1 inch = 1440 twips)
const SPACING = {
  xs: 60,    // 0.04 inch
  sm: 100,   // 0.07 inch
  md: 160,   // 0.11 inch
  lg: 240,   // 0.17 inch
  xl: 360,   // 0.25 inch
  xxl: 480,  // 0.33 inch
  xxxl: 720, // 0.5 inch
};

/**
 * Create a styled paragraph with consistent formatting
 */
function createParagraph(
  text: string,
  options: {
    size?: number;        // Font size in half-points (24 = 12pt)
    bold?: boolean;
    italics?: boolean;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingBefore?: number;
    spacingAfter?: number;
    lineSpacing?: number;
    pageBreakBefore?: boolean;
    bullet?: boolean;
    shading?: { fill: string; color?: string };
    indent?: { left: number };
  } = {},
) {
  const fontSize = options.size ?? 22; // Default 11pt
  
  return new Paragraph({
    alignment: options.align,
    heading: options.size === 56 ? HeadingLevel.HEADING_1 : 
             options.size === 40 ? HeadingLevel.HEADING_2 : undefined,
    pageBreakBefore: options.pageBreakBefore,
    bullet: options.bullet ? { level: 0 } : undefined,
    spacing: {
      before: options.spacingBefore ?? 0,
      after: options.spacingAfter ?? SPACING.md,
      line: options.lineSpacing ?? 360, // 1.5 line spacing
    },
    shading: options.shading,
    indent: options.indent,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: fontSize,
        bold: options.bold,
        italics: options.italics,
        color: options.color || COLORS.textDark,
      }),
    ],
  });
}

/**
 * Render different block types with proper styling
 */
function renderBlock(block: ExportBlock): Paragraph[] {
  switch (block.type) {
    case 'paragraph':
      return [
        createParagraph(block.text, {
          size: 22, // 11pt
          bold: block.bold,
          color: block.muted ? COLORS.textMedium : COLORS.textDark,
          spacingAfter: SPACING.md,
          lineSpacing: 400, // Slightly more relaxed
        }),
      ];
      
    case 'subheading':
      return [
        createParagraph(block.text, {
          size: 28, // 14pt
          bold: true,
          color: COLORS.primary,
          spacingBefore: SPACING.lg,
          spacingAfter: SPACING.sm,
        }),
      ];
      
    case 'bullets':
      return [
        // Add some space before bullet list
        createParagraph('', { spacingAfter: SPACING.xs }),
        ...block.items.map((item) =>
          createParagraph(item, {
            size: 22, // 11pt
            bullet: true,
            color: COLORS.textDark,
            spacingAfter: SPACING.xs,
            lineSpacing: 380,
          }),
        ),
        // Add space after bullet list
        createParagraph('', { spacingAfter: SPACING.sm }),
      ];
      
    case 'limitation':
      return [
        createParagraph(block.title, { 
          size: 28, 
          bold: true, 
          color: COLORS.warning, 
          spacingBefore: SPACING.lg, 
          spacingAfter: SPACING.xs 
        }),
        createParagraph(block.description, { 
          size: 22, 
          color: COLORS.textDark, 
          spacingAfter: SPACING.sm,
          lineSpacing: 380,
        }),
        createParagraph(`Mitigation: ${block.mitigation}`, { 
          size: 22,
          bullet: true,
          color: COLORS.success,
          bold: true,
          spacingAfter: SPACING.lg,
          shading: { fill: 'F0FDF4' }, // Light green background
        }),
      ];
      
    case 'risk':
      const severityColor = block.severity === 'CRITICAL' ? COLORS.danger : 
                           block.severity === 'HIGH' ? COLORS.warning : 
                           COLORS.textMedium;
      
      return [
        createParagraph(block.title, { 
          size: 28, 
          bold: true, 
          color: COLORS.danger, 
          spacingBefore: SPACING.xl, 
          spacingAfter: SPACING.xs 
        }),
        createParagraph(`Category: ${block.category} | Severity: ${block.severity}`, { 
          size: 20, 
          color: severityColor,
          bold: true,
          spacingAfter: SPACING.sm,
        }),
        createParagraph(block.description, { 
          size: 22, 
          color: COLORS.textDark, 
          spacingAfter: SPACING.sm,
          lineSpacing: 380,
        }),
        createParagraph(`Recommendation: ${block.recommendation}`, { 
          size: 22,
          bullet: true,
          color: COLORS.primary,
          bold: true,
          spacingAfter: SPACING.lg,
          shading: { fill: 'EFF6FF' }, // Light blue background
        }),
      ];
  }
}

export async function exportToDocx(
  data: ReportData,
  insights: InsightMap = {},
  filename = 'OT-Report.docx',
) {
  try {
    addExportHistory('docx', data.config.type, data.config.startDate, data.config.endDate);

    const content = buildExportContent(data, insights);
    const children: Paragraph[] = [];

    // ═══════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════
    
    // Add vertical spacing at top
    children.push(createParagraph('', { spacingBefore: SPACING.xxxl * 2 }));
    
    // Report type label
    children.push(createParagraph(content.cover.reportLabel, {
      size: 24, // 12pt
      bold: true,
      color: COLORS.primary,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.lg,
    }));
    
    // Main title
    children.push(createParagraph(content.cover.title, {
      size: 44, // 22pt
      bold: true,
      color: COLORS.textDark,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.md,
    }));
    
    // Client name with accent color
    children.push(createParagraph(content.cover.clientName, {
      size: 32, // 16pt
      bold: true,
      color: COLORS.accent,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.lg,
    }));
    
    // Divider line
    children.push(createParagraph('─'.repeat(60), {
      size: 16,
      color: COLORS.border,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.lg,
    }));
    
    // Reporting period
    children.push(createParagraph(content.cover.periodLabel, {
      size: 24, // 12pt
      color: COLORS.textMedium,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.sm,
    }));
    
    // Prepared by
    children.push(createParagraph(content.cover.providerLabel, {
      size: 22, // 11pt
      color: COLORS.textMedium,
      align: AlignmentType.CENTER,
      spacingAfter: SPACING.xxxl,
    }));
    
    // Confidentiality notice with subtle background
    children.push(createParagraph(content.cover.confidentialityNotice, {
      size: 20, // 10pt
      color: COLORS.textLight,
      italics: true,
      spacingAfter: SPACING.xxl,
      spacingBefore: SPACING.xxl,
      shading: { fill: COLORS.bgLight },
    }));
    
    // Page break before first section
    children.push(new Paragraph({
      pageBreakBefore: true,
    }));

    // ═══════════════════════════════════════════
    // REPORT SECTIONS
    // ═══════════════════════════════════════════
    
    content.sections.forEach((section, index) => {
      // Section title with clear visual hierarchy
      children.push(createParagraph(`${section.number}. ${section.title}`, {
        size: 36, // 18pt
        bold: true,
        color: COLORS.primary,
        pageBreakBefore: true,
        spacingBefore: SPACING.xxl,
        spacingAfter: SPACING.lg,
      }));
      
      // Add decorative underline
      children.push(createParagraph('─'.repeat(40), {
        size: 14,
        color: COLORS.primaryLight,
        spacingAfter: SPACING.lg,
      }));

      // Render all blocks in section
      section.blocks.forEach((block) => {
        children.push(...renderBlock(block));
      });

      // Add extra spacing between sections
      if (index < content.sections.length - 1) {
        children.push(createParagraph('', { spacingAfter: SPACING.xxl }));
      }
    });
    
    // Final spacing
    children.push(createParagraph('', { spacingAfter: SPACING.xxl }));

    // Create document with proper page setup
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: FONT,
              size: 22, // 11pt default
              color: COLORS.textDark,
            },
            paragraph: {
              spacing: {
                line: 360, // 1.5 line spacing
              },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),      // 1 inch top
                bottom: convertInchesToTwip(1),   // 1 inch bottom
                left: convertInchesToTwip(1.25),  // 1.25 inch left
                right: convertInchesToTwip(1.25), // 1.25 inch right
              },
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || `OT-Report-${format(new Date(), 'yyyy-MM-dd')}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('[DOCX Export] Error:', err);
    alert('DOCX export failed. Check console for details.');
  }
}

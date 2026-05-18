export function chunkRows<T>(rows: T[], chunkSize: number): T[][] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
    return [rows];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }

  return chunks;
}

function truncateByWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  const candidate = text.slice(0, Math.max(0, maxChars - 1));
  const lastSpace = candidate.lastIndexOf(' ');
  const trimmed = (lastSpace > 40 ? candidate.slice(0, lastSpace) : candidate).trim();
  return `${trimmed}…`;
}

export function limitNarrativeText(
  text: string | null | undefined,
  options?: {
    maxChars?: number;
    maxSentences?: number;
  },
): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  const maxChars = options?.maxChars ?? 520;
  const maxSentences = options?.maxSentences ?? 3;

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const sentenceLimited = sentences.slice(0, maxSentences).join(' ');
  return truncateByWordBoundary(sentenceLimited, maxChars);
}

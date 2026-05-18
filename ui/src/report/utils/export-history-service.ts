import type { ExportFormat } from '../types';

const EXPORT_HISTORY_KEY = 'ot_report_export_history';

export interface ExportHistoryEntry {
  id: string;
  format: ExportFormat;
  exportedAt: string;
  reportPeriod: {
    type: 'weekly' | 'monthly';
    startDate: string;
    endDate: string;
  };
  exportedBy: string; // Username/account
}

/**
 * Get current user/account identifier
 * Falls back to browser info if no user is available
 */
function getCurrentUser(): string {
  // Try to get from localStorage if previously set
  const storedUser = localStorage.getItem('ot_current_user');
  if (storedUser) return storedUser;
  
  // Fall back to unknown user
  return 'Unknown User';
}

/**
 * Save export history entry
 */
export function addExportHistory(
  format: ExportFormat,
  reportType: 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): void {
  try {
    const history = getExportHistory();
    
    const entry: ExportHistoryEntry = {
      id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      format,
      exportedAt: new Date().toISOString(),
      reportPeriod: {
        type: reportType,
        startDate,
        endDate,
      },
      exportedBy: getCurrentUser(),
    };
    
    // Keep only last 100 exports
    history.unshift(entry);
    if (history.length > 100) {
      history.pop();
    }
    
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('Failed to save export history:', err);
  }
}

/**
 * Get all export history
 */
export function getExportHistory(): ExportHistoryEntry[] {
  try {
    const history = localStorage.getItem(EXPORT_HISTORY_KEY);
    if (!history) return [];
    
    return JSON.parse(history) as ExportHistoryEntry[];
  } catch (err) {
    console.warn('Failed to retrieve export history:', err);
    return [];
  }
}

/**
 * Get export history filtered by format
 */
export function getExportHistoryByFormat(format: ExportFormat): ExportHistoryEntry[] {
  return getExportHistory().filter(entry => entry.format === format);
}

/**
 * Get export history filtered by user
 */
export function getExportHistoryByUser(user: string): ExportHistoryEntry[] {
  return getExportHistory().filter(entry => entry.exportedBy === user);
}

/**
 * Delete a specific export history entry
 */
export function deleteExportHistoryEntry(id: string): void {
  try {
    const history = getExportHistory();
    const filtered = history.filter(entry => entry.id !== id);
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete export history entry:', err);
  }
}

/**
 * Clear all export history
 */
export function clearExportHistory(): void {
  try {
    localStorage.removeItem(EXPORT_HISTORY_KEY);
  } catch (err) {
    console.warn('Failed to clear export history:', err);
  }
}

/**
 * Set current user for export tracking
 */
export function setCurrentUser(username: string): void {
  try {
    localStorage.setItem('ot_current_user', username);
  } catch (err) {
    console.warn('Failed to set current user:', err);
  }
}

/**
 * Get current tracked user
 */
export function getCurrentTrackedUser(): string {
  return getCurrentUser();
}

/**
 * Get export history grouped by date
 */
export function getExportHistoryGroupedByDate(): Record<string, ExportHistoryEntry[]> {
  const history = getExportHistory();
  const grouped: Record<string, ExportHistoryEntry[]> = {};
  
  history.forEach(entry => {
    const date = new Date(entry.exportedAt).toLocaleDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(entry);
  });
  
  return grouped;
}

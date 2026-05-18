import {
  LIVE_SECURITY_EVENTS_COLUMN_OPTIONS,
  LIVE_SECURITY_EVENTS_TABLE_KEY,
} from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { useCallback, useMemo } from "react";

const LIVE_SECURITY_MIN_SELECTED_COLUMNS = 2;
const LIVE_SECURITY_SELECT_ALL_FALLBACK_COLUMNS = ["timestamp", "action"];

export default function useLiveSecurityVisibleColumns() {
  const tableColumns = useUserStore((state) => state.tableColumns);
  const setTableVisibleColumns = useUserStore((state) => state.setTableVisibleColumns);

  const visibleColumnIds = useMemo(() => {
    const defaultColumnIds = LIVE_SECURITY_EVENTS_COLUMN_OPTIONS.map((column) => column.id);
    const persistedColumnIds = tableColumns[LIVE_SECURITY_EVENTS_TABLE_KEY];
    if (!persistedColumnIds?.length) {
      return defaultColumnIds;
    }

    const sanitizedPersisted = defaultColumnIds.filter((columnId) => persistedColumnIds.includes(columnId));
    if (sanitizedPersisted.length >= LIVE_SECURITY_MIN_SELECTED_COLUMNS) {
      return sanitizedPersisted;
    }

    const fallbackColumns = defaultColumnIds
      .filter((columnId) => LIVE_SECURITY_SELECT_ALL_FALLBACK_COLUMNS.includes(columnId));
    if (fallbackColumns.length >= LIVE_SECURITY_MIN_SELECTED_COLUMNS) {
      return fallbackColumns;
    }

    return defaultColumnIds.slice(0, LIVE_SECURITY_MIN_SELECTED_COLUMNS);
  }, [tableColumns]);

  const visibleColumnSet = useMemo(
    () => new Set(visibleColumnIds),
    [visibleColumnIds],
  );

  const visibleColumnCount = visibleColumnIds.length || LIVE_SECURITY_EVENTS_COLUMN_OPTIONS.length;

  const setVisibleColumnIds = useCallback(
    (nextColumnIds: string[]) => {
      setTableVisibleColumns(LIVE_SECURITY_EVENTS_TABLE_KEY, nextColumnIds);
    },
    [setTableVisibleColumns],
  );

  return {
    visibleColumnIds,
    visibleColumnSet,
    visibleColumnCount,
    minSelectedColumns: LIVE_SECURITY_MIN_SELECTED_COLUMNS,
    selectAllFallbackColumnIds: LIVE_SECURITY_SELECT_ALL_FALLBACK_COLUMNS,
    setVisibleColumnIds,
  };
}

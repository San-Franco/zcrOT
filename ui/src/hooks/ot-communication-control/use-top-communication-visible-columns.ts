import {
  TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS,
  TOP_COMMUNICATION_FLOWS_TABLE_KEY,
} from "@/lib/utils";
import useUserStore from "@/stores/user-store";
import { useCallback, useMemo } from "react";

const TOP_FLOW_MIN_SELECTED_COLUMNS = 2;
const TOP_FLOW_SELECT_ALL_FALLBACK_COLUMNS = ["lastSeen", "events"];

export default function useTopCommunicationVisibleColumns() {
  const tableColumns = useUserStore((state) => state.tableColumns);
  const setTableVisibleColumns = useUserStore((state) => state.setTableVisibleColumns);

  const visibleColumnIds = useMemo(() => {
    const defaultColumnIds = TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS.map((column) => column.id);
    const persistedColumnIds = tableColumns[TOP_COMMUNICATION_FLOWS_TABLE_KEY];
    if (!persistedColumnIds?.length) {
      return defaultColumnIds;
    }

    const sanitizedPersisted = defaultColumnIds.filter((columnId) => persistedColumnIds.includes(columnId));
    if (sanitizedPersisted.length >= TOP_FLOW_MIN_SELECTED_COLUMNS) {
      return sanitizedPersisted;
    }

    const fallbackColumns = defaultColumnIds
      .filter((columnId) => TOP_FLOW_SELECT_ALL_FALLBACK_COLUMNS.includes(columnId));
    if (fallbackColumns.length >= TOP_FLOW_MIN_SELECTED_COLUMNS) {
      return fallbackColumns;
    }

    return defaultColumnIds.slice(0, TOP_FLOW_MIN_SELECTED_COLUMNS);
  }, [tableColumns]);

  const visibleColumnSet = useMemo(
    () => new Set(visibleColumnIds),
    [visibleColumnIds],
  );

  const visibleColumnCount = visibleColumnIds.length || TOP_COMMUNICATION_FLOWS_COLUMN_OPTIONS.length;

  const setVisibleColumnIds = useCallback(
    (nextColumnIds: string[]) => {
      setTableVisibleColumns(TOP_COMMUNICATION_FLOWS_TABLE_KEY, nextColumnIds);
    },
    [setTableVisibleColumns],
  );

  return {
    visibleColumnIds,
    visibleColumnSet,
    visibleColumnCount,
    minSelectedColumns: TOP_FLOW_MIN_SELECTED_COLUMNS,
    selectAllFallbackColumnIds: TOP_FLOW_SELECT_ALL_FALLBACK_COLUMNS,
    setVisibleColumnIds,
  };
}

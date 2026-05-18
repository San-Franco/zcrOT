import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { TbColumns3 } from "react-icons/tb";

type Props = {
  columns: TableColumnToggleOption[];
  selectedColumnIds: string[];
  onSelectedColumnIdsChange: (nextColumnIds: string[]) => void;
  isDisabled?: boolean;
  title?: string;
  minSelected?: number;
  selectAllFallbackColumnIds?: string[];
  buttonClassName?: string;
  contentClassName?: string;
};

export default function ColumnToggle({
  columns,
  selectedColumnIds,
  onSelectedColumnIdsChange,
  isDisabled = false,
  title = "Toggle Columns",
  minSelected = 2,
  selectAllFallbackColumnIds,
  buttonClassName,
  contentClassName,
}: Props) {
  const effectiveMinSelected = useMemo(
    () => Math.min(Math.max(1, minSelected), Math.max(1, columns.length)),
    [columns.length, minSelected],
  );

  const allColumnIds = useMemo(
    () => columns.map((column) => column.id),
    [columns],
  );

  const selectedSet = useMemo(
    () => new Set(selectedColumnIds),
    [selectedColumnIds],
  );

  const selectedCount = useMemo(
    () => columns.reduce((count, column) => (selectedSet.has(column.id) ? count + 1 : count), 0),
    [columns, selectedSet],
  );

  const selectAllFallbackIds = useMemo(() => {
    const preferredIds = (selectAllFallbackColumnIds ?? [])
      .filter((columnId) => allColumnIds.includes(columnId));

    const normalized = Array.from(new Set(preferredIds));
    if (normalized.length >= effectiveMinSelected) {
      return normalized;
    }

    const fillIds = allColumnIds.filter((columnId) => !normalized.includes(columnId));
    return [...normalized, ...fillIds].slice(0, effectiveMinSelected);
  }, [allColumnIds, effectiveMinSelected, selectAllFallbackColumnIds]);

  const allColumnsSelected = columns.length > 0 && selectedCount === columns.length;

  const handleCheckedChange = (columnId: string, checked: boolean | "indeterminate") => {
    const nextSelected = new Set(selectedColumnIds);
    const isChecked = checked === true;

    if (isChecked) {
      nextSelected.add(columnId);
    } else {
      nextSelected.delete(columnId);
    }

    const orderedSelected = columns
      .map((column) => column.id)
      .filter((columnIdItem) => nextSelected.has(columnIdItem));

    if (orderedSelected.length < effectiveMinSelected) {
      return;
    }

    onSelectedColumnIdsChange(orderedSelected);
  };

  const handleSelectAllChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    if (isChecked) {
      onSelectedColumnIdsChange(allColumnIds);
      return;
    }

    onSelectedColumnIdsChange(selectAllFallbackIds);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isDisabled}
          variant="outline"
          size="icon"
          className={cn("h-9 w-9 cursor-pointer", buttonClassName)}
          aria-label={title}
        >
          <TbColumns3 className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn("w-56 border-dark-border/50 bg-dark-surface", contentClassName)}
      >
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="custome-scrollbar custom-scrollbar max-h-60 overflow-y-auto pr-1">
          {columns.map((column) => {
            const checked = selectedSet.has(column.id);
            const isSingleSelectionLocked = checked && selectedCount <= effectiveMinSelected;

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={checked}
                disabled={isSingleSelectionLocked}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(nextChecked) => handleCheckedChange(column.id, nextChecked)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={allColumnsSelected}
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={handleSelectAllChange}
        >
          Select All
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

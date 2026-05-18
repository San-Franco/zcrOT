import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { useSearchParams } from "react-router";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  isDisabled?: boolean;
  filters: Filter[];
  filterValue?: string;
  otherClasses?: string;
  containerClasses?: string;
  addFirst?: boolean;
  label?: string;
  Icon?: IconType;
  placeholder?: string;
  defaultShow?: string;
};

export default function CommonFilter({
  isDisabled,
  filters,
  filterValue = "filter",
  otherClasses = "",
  containerClasses = "",
  addFirst = true,
  label,
  Icon,
  placeholder = "Select a filter",
  defaultShow,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsFilter = searchParams.get(filterValue);
  const [key, setKey] = useState(0);

  const handleUpdateParams = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set(filterValue, value);
    setSearchParams(nextParams);
  };

  const defaultValue = addFirst ? filters[0]?.value : undefined;

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [paramsFilter]);

  return (
    <div className={cn("flex flex-col gap-2", containerClasses)}>
      {label && (
        <Label htmlFor={`filter-${filterValue}`} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="relative">
        <Select
          key={key}
          onValueChange={handleUpdateParams}
          defaultValue={paramsFilter || defaultValue || defaultShow}
        >
          <SelectTrigger
            disabled={isDisabled}
            id={`filter-${filterValue}`}
            aria-label="Filter options"
            className={cn(
              "no-focus background-light800_dark300 text-dark500_light700 relative z-10 w-full cursor-pointer border px-5 py-1.5",
              Icon && "pl-10",
              otherClasses,
            )}
          >
            <div className="flex-1 text-left line-clamp-1">
              <SelectValue placeholder={placeholder} />
            </div>
          </SelectTrigger>
          <SelectContent
            className="z-50 border-dark-border/50 bg-linear-to-br from-dark-surface via-dark-surface to-dark-bg"
            position="popper"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <SelectGroup className="space-y-1">
              {filters.map((item) => (
                <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {Icon && <Icon className="pointer-events-none absolute left-3 top-3 size-4.5" />}
      </div>
    </div>
  );
}

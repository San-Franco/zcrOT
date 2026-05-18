import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { IconType } from "react-icons";
import { TbUserSearch } from "react-icons/tb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LocalSearchProps = {
  isDisabled?: boolean;
  placeholder?: string;
  filterValue?: string;
  Icon?: IconType;
  label?: string;
  inputClassName?: string;
};

export default function LocalSearch({
  isDisabled,
  placeholder = "Search by keywords...",
  filterValue = "search",
  Icon = TbUserSearch,
  label,
  inputClassName = "w-full",
}: LocalSearchProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(filterValue);
  const [query, setQuery] = useState(search || "");

  useEffect(() => {
    setQuery(search || "");
  }, [search]);

  useEffect(() => {
    const debounceFunc = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams);

      if (query) {
        nextParams.set(filterValue, query);
      } else {
        nextParams.delete(filterValue);
      }

      setSearchParams(nextParams);
    }, 300);

    return () => clearTimeout(debounceFunc);
  }, [filterValue, query, searchParams, setSearchParams]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={`search-${filterValue}`} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="relative">
        <Input
          disabled={isDisabled}
          id={`search-${filterValue}`}
          value={query}
          type="search"
          placeholder={placeholder}
          className={cn(inputClassName, "min-h-11 pl-10")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Icon className="absolute left-3 top-3 size-[18px]" />
      </div>
    </div>
  );
}

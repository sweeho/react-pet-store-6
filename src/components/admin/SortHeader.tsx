import { ArrowDown, ArrowUp } from "lucide-react";

import type { Sort, SortKey } from "./format";

const th = "bg-muted text-muted-foreground h-10 border-b px-4 text-left text-xs font-semibold";

interface Props {
  label: string;
  sortKey: SortKey;
  sort: Sort | null;
  onSort: (key: SortKey) => void;
  className?: string;
}

/** A column header that sorts its table when clicked. */
export function SortHeader({ label, sortKey, sort, onSort, className = "" }: Props) {
  const active = sort?.key === sortKey ? sort : null;
  return (
    <th
      aria-sort={active?.dir ?? "none"}
      className={`${th} cursor-pointer select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <button type="button" className="inline-flex items-center gap-1">
        {label}
        {active?.dir === "ascending" && <ArrowUp aria-hidden="true" className="size-3" />}
        {active?.dir === "descending" && <ArrowDown aria-hidden="true" className="size-3" />}
      </button>
    </th>
  );
}

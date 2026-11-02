import type { OrderRow } from "./types";

const MDY = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

/** `M/D/YYYY` text passes through; an ISO timestamp is shown as UTC `M/D/YYYY`. */
export const formatDate = (text: string): string => {
  if (MDY.test(text)) return text;
  const d = new Date(text);
  return Number.isNaN(d.getTime())
    ? text
    : `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
};

export const formatAmount = (n: number): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The order id as shown: -1 when it is not all digits. */
export const displayId = (id: string): string => (/^\d+$/.test(id) ? id : "-1");

export type SortKey = "id" | "userId" | "date" | "amount" | "status";
export interface Sort {
  key: SortKey;
  dir: "ascending" | "descending";
}

const sortValue = (r: OrderRow, key: SortKey): number | string => {
  if (key === "id") return Number(displayId(r.id));
  if (key === "amount") return r.amount;
  if (key === "date") {
    const t = Date.parse(formatDate(r.date));
    return Number.isNaN(t) ? 0 : t;
  }
  return r[key];
};

/** The rows ordered by `sort`; the input order when there is none. */
export function sortRows(rows: OrderRow[], sort: Sort | null): OrderRow[] {
  if (!sort) return rows;
  const sign = sort.dir === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = sortValue(a, sort.key);
    const y = sortValue(b, sort.key);
    const c =
      typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return c * sign;
  });
}

/** Clicking the active column reverses it; any other column sorts ascending. */
export const nextSort = (sort: Sort | null, key: SortKey): Sort =>
  sort?.key === key && sort.dir === "ascending"
    ? { key, dir: "descending" }
    : { key, dir: "ascending" };

import { StatusBadge } from "./StatusBadge";
import { formatAmount, formatDate } from "./format";
import type { Decision, OrderRow } from "./types";

const th = "bg-muted text-muted-foreground h-10 border-b px-4 text-left text-xs font-semibold";
const td = "h-10 border-b px-4 whitespace-nowrap last:border-b-0";

interface Props {
  rows: OrderRow[];
  marks: Record<string, Decision>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

/** Pending orders with a tick box per row; a marked row shows its uncommitted status. */
export function PendingTable({ rows, marks, selected, onToggle, onToggleAll }: Props) {
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${th} w-12`}>
              <input
                type="checkbox"
                aria-label="Select all orders"
                checked={all}
                onChange={onToggleAll}
                className="size-4"
              />
            </th>
            <th className={th}>Order ID</th>
            <th className={th}>User ID</th>
            <th className={th}>Date</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={`${th} w-[360px]`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const mark = marks[r.id];
            return (
              <tr key={r.id} className={mark ? "bg-muted" : undefined}>
                <td className={td}>
                  <input
                    type="checkbox"
                    aria-label={`Select order ${r.id}`}
                    checked={selected.has(r.id)}
                    onChange={() => onToggle(r.id)}
                    className="size-4"
                  />
                </td>
                <td className={`${td} font-mono`}>{r.id}</td>
                <td className={td}>{r.userId}</td>
                <td className={`${td} text-muted-foreground font-mono`}>{formatDate(r.date)}</td>
                <td className={`${td} text-right font-mono`}>{formatAmount(r.amount)}</td>
                <td className={td}>
                  <StatusBadge status={mark ?? r.status} />
                  {mark && (
                    <span className="text-muted-foreground ml-2 text-xs">Not committed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

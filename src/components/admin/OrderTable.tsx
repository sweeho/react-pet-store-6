import { StatusBadge } from "./StatusBadge";
import { formatAmount, formatDate } from "./format";
import type { OrderRow } from "./types";

const th = "bg-muted text-muted-foreground h-10 border-b px-4 text-left text-xs font-semibold";
const td = "h-10 border-b px-4 whitespace-nowrap last:border-b-0";

/** Read-only orders: ID, User ID, Date, Amount, Status. */
export function OrderTable({ rows }: { rows: OrderRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>ID</th>
            <th className={th}>User ID</th>
            <th className={th}>Date</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={`${td} font-mono`}>{r.id}</td>
              <td className={td}>{r.userId}</td>
              <td className={`${td} text-muted-foreground font-mono`}>{formatDate(r.date)}</td>
              <td className={`${td} text-right font-mono`}>{formatAmount(r.amount)}</td>
              <td className={td}>
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

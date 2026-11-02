import { SortHeader } from "./SortHeader";
import { StatusBadge } from "./StatusBadge";
import { displayId, formatAmount, formatDate, nextSort, sortRows } from "./format";
import type { Sort, SortKey } from "./format";
import type { OrderRow } from "./types";

const td = "h-10 border-b px-4 whitespace-nowrap last:border-b-0";

/** Orders sortable by any column: ID, User ID, Date, Amount, Status. */
export default function OrderTable({ orders }: { orders: OrderRow[] }) {
  const [sort, setSort] = useState<Sort | null>(null);
  const onSort = (key: SortKey) => setSort((s) => nextSort(s, key));
  if (orders.length === 0)
    return (
      <p className="text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
        No orders in this status
      </p>
    );
  const head = { sort, onSort };
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <SortHeader label="ID" sortKey="id" {...head} />
            <SortHeader label="User ID" sortKey="userId" {...head} />
            <SortHeader label="Date" sortKey="date" {...head} />
            <SortHeader label="Amount" sortKey="amount" className="text-right" {...head} />
            <SortHeader label="Status" sortKey="status" {...head} />
          </tr>
        </thead>
        <tbody>
          {sortRows(orders, sort).map((r) => (
            <tr key={r.id}>
              <td className={`${td} font-mono`}>{displayId(r.id)}</td>
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

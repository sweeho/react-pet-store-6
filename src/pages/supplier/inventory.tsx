import { ChevronLeft, Check, LogOut } from "lucide-react";
import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import ErrorFrame from "@/components/shell/ErrorFrame";
import LoadingFrame from "@/components/shell/LoadingFrame";
import { Button } from "@/components/ui";
import { useApi } from "@/hooks";

interface Stock {
  itemId: string;
  quantity: number;
}

const field =
  "bg-background focus-visible:outline-ring h-9 w-28 rounded-md border px-3 text-sm outline-none focus-visible:outline-2";

export default function SupplierInventory() {
  const { data, error, loading, retry } = useApi<Stock[]>("/api/supplier/inventory");
  const navigate = useNavigate();
  // The list the last Submit returned; until then the loaded one is shown.
  const [stock, setStock] = useState<Stock[] | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (loading) return <LoadingFrame label="Loading inventory…" />;
  if (error) {
    // A 401 means the supplier is not signed in: the sign-in form lives on the supplier home.
    if (/status 401/.test(error.message)) {
      void navigate("/supplier");
      return null;
    }
    return <ErrorFrame onRetry={retry} title="We couldn’t load the inventory" />;
  }
  const rows = stock ?? data ?? [];
  if (rows.length === 0)
    return <EmptyFrame title="No stock yet" message="There are no items in inventory." />;

  const count = rows.filter((r) => marked[r.itemId]).length;

  const submit = async () => {
    setFailure(null);
    const res = await fetch("/api/supplier/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: rows.map((r) => ({
          itemId: r.itemId,
          quantity: entries[r.itemId] ?? "",
          marked: marked[r.itemId] === true,
        })),
      }),
    }).catch(() => null);
    if (res?.status === 401) return void navigate("/supplier");
    if (!res?.ok) {
      setFailure(
        res?.status === 400
          ? "A ticked row has a quantity that is not a whole number of zero or more. Nothing was saved."
          : "The inventory could not be saved. Try again.",
      );
      return;
    }
    setStock((await res.json()) as Stock[]);
    setEntries({});
    setMarked({});
    setConfirmed(true);
  };

  const logOut = async () => {
    await fetch("/api/supplier/sign-out", { method: "POST" });
    void navigate("/supplier");
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link to="/supplier" className="hover:underline">
          Supplier
        </Link>{" "}
        / <span className="text-foreground">Inventory</span>
      </nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Supplier inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter a new quantity and tick <b>Update</b> on each row you want to change. Only ticked
            rows are saved.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-muted rounded-full border px-3 py-1 text-xs">
            {count} {count === 1 ? "row" : "rows"} marked
          </span>
          <Button asChild variant="outline">
            <Link to="/supplier" onClick={() => setConfirmed(false)}>
              <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
              Supplier home
            </Link>
          </Button>
          <Button type="button" onClick={() => void submit()}>
            <Check aria-hidden="true" className="mr-2 size-4" />
            Submit
          </Button>
        </div>
      </div>

      {confirmed && (
        <div role="status" className="bg-muted mb-4 flex items-center gap-3 rounded-lg border p-4">
          <span className="font-semibold">Inventory updated</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmed(false)}>
            Display Inventory
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void logOut()}>
            <LogOut aria-hidden="true" className="mr-1 size-4" />
            Logout
          </Button>
        </div>
      )}
      {failure && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {failure}
        </p>
      )}

      <div className="bg-background overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 text-right font-medium">Quantity on hand</th>
              <th className="px-4 py-2 font-medium">New quantity</th>
              <th className="px-4 py-2 text-center font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const on = marked[r.itemId] === true;
              const typed = (entries[r.itemId] ?? "") !== "";
              return (
                <tr key={r.itemId} className={on ? "bg-muted/50 border-t" : "border-t"}>
                  <td className="px-4 py-2 font-mono">{r.itemId}</td>
                  <td className="px-4 py-2 text-right font-mono">
                    {r.quantity.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`New quantity for ${r.itemId}`}
                      value={entries[r.itemId] ?? ""}
                      onChange={(e) => setEntries({ ...entries, [r.itemId]: e.target.value })}
                      className={field}
                    />
                    {typed && !on && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        Not marked — won’t be saved
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Mark ${r.itemId} for update`}
                      checked={on}
                      onChange={(e) => setMarked({ ...marked, [r.itemId]: e.target.checked })}
                      className="size-4"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-muted-foreground flex justify-between border-t px-4 py-2 text-xs">
          <span>
            <b>{rows.length} items</b>
          </span>
          <span>Quantities are whole numbers of units.</span>
        </div>
      </div>
    </div>
  );
}

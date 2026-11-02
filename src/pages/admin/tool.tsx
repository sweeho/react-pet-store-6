import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Check, CircleX, Info, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";

import { ChartPanel } from "@/components/admin/ChartPanel";
import type { ChartPoint } from "@/components/admin/ChartPanel";
import OrderTable from "@/components/admin/OrderTable";
import { PendingTable } from "@/components/admin/PendingTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Decision, OrderRow } from "@/components/admin/types";
import { Button } from "@/components/ui";

const STATUSES = ["PENDING", "APPROVED", "DENIED", "COMPLETED"] as const;
const REFRESH_WARNING = "Data is not committed. Are you sure you want to refresh?";

type Busy = "retrieve" | "update" | null;
interface Range {
  start: string;
  end: string;
}
type Charts = { revenue: ChartPoint[]; count: ChartPoint[] };

const DEFAULT_RANGE: Range = { start: "01/01/2001", end: "12/31/2002" };

class SignOnRequired extends Error {}

/** MM/DD/YYYY to ISO YYYY-MM-DD, or undefined when it is not a date. */
function toIso(text: string): string | undefined {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : undefined;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (res.status === 401) throw new SignOnRequired();
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

type Raw = Partial<{
  orderId: string;
  id: string;
  userId: string;
  date: string;
  totalPrice: number;
  amount: number;
  status: string;
}>;

/** The orders route replies with the row array; a `{ orders | items }` object is accepted too. */
async function loadOrders(status: string): Promise<OrderRow[]> {
  const body = (await getJson(`/api/admin/orders?status=${status}`)) as
    | Raw[]
    | { orders?: Raw[]; items?: Raw[] }
    | null;
  const list = Array.isArray(body) ? body : (body?.orders ?? body?.items ?? []);
  return list.map((o) => ({
    id: o.orderId ?? o.id ?? "",
    userId: o.userId ?? "",
    date: o.date ?? "",
    amount: o.totalPrice ?? o.amount ?? 0,
    status: o.status ?? status,
  }));
}

async function loadChart(kind: "revenue" | "order-counts", range: Range): Promise<ChartPoint[]> {
  const start = toIso(range.start);
  const end = toIso(range.end);
  if (!start || !end) return [];
  const body = await getJson(`/api/admin/sales/${kind}?start=${start}&end=${end}`);
  return Array.isArray(body) ? (body as ChartPoint[]) : [];
}

const tabClass = (selected: boolean) =>
  `flex h-10 items-center gap-2 border-b-2 -mb-px text-sm font-medium outline-none ${
    selected ? "border-primary text-primary" : "text-muted-foreground border-transparent"
  }`;

const viewClass = (selected: boolean) =>
  `flex h-[30px] items-center rounded-md px-3.5 text-sm font-medium outline-none ${
    selected ? "bg-background text-foreground ring-border ring-1" : "text-muted-foreground"
  }`;

const Count = ({ n }: { n: number }) => (
  <span className="bg-muted text-muted-foreground rounded-full border px-2 font-mono text-xs leading-[18px]">
    {n}
  </span>
);

export default function Tool() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderRow[]>>({});
  const [charts, setCharts] = useState<Charts>({ revenue: [], count: [] });
  // One date range drives both charts; Submit applies the typed range, Refresh reuses the applied one.
  const [draft, setDraft] = useState<Range>(DEFAULT_RANGE);
  const [applied, setApplied] = useState<Range>(DEFAULT_RANGE);
  const [marks, setMarks] = useState<Record<string, Decision>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [aboutOpen, setAboutOpen] = useState(false);
  const started = useRef(false);

  const fail = (e: unknown) => {
    if (e instanceof SignOnRequired) void navigate("/admin");
    else setError(e instanceof Error ? e.message : "The request failed.");
  };

  /**
   * Loads the four order lists and both charts for the given date ranges. Every request goes out
   * at once and each reply is applied as it arrives. The pending list is requested last and the
   * actions come back once it is applied, since Approve, Deny and Commit work on that list.
   */
  const loadAll = async (range: Range) => {
    setBusy("retrieve");
    setError(null);
    const apply = <T,>(request: Promise<T>, use: (value: T) => void) =>
      request.then(use).catch(fail);
    for (const status of ["APPROVED", "DENIED", "COMPLETED"]) {
      void apply(loadOrders(status), (rows) => setOrders((o) => ({ ...o, [status]: rows })));
    }
    void apply(loadChart("revenue", range), (revenue) => setCharts((c) => ({ ...c, revenue })));
    void apply(loadChart("order-counts", range), (count) => setCharts((c) => ({ ...c, count })));
    await apply(loadOrders("PENDING"), (rows) => {
      setOrders((o) => ({ ...o, PENDING: rows }));
      setMarks({});
      setSelected(new Set());
    });
    setBusy(null);
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadAll(applied);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on start
  }, []);

  const refresh = () => {
    if (Object.keys(marks).length > 0 && !window.confirm(REFRESH_WARNING)) return;
    void loadAll(applied);
  };

  const submitRange = async () => {
    setBusy("retrieve");
    setError(null);
    try {
      const [revenue, count] = await Promise.all([
        loadChart("revenue", draft),
        loadChart("order-counts", draft),
      ]);
      setCharts({ revenue, count });
      setApplied(draft);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const commit = async () => {
    const decisions = Object.entries(marks).map(([orderId, status]) => ({ orderId, status }));
    if (decisions.length === 0) return;
    setBusy("update");
    setError(null);
    try {
      const res = await fetch("/api/admin/orders/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
      if (res.status === 401) throw new SignOnRequired();
      if (!res.ok) throw new Error(`The decisions were not accepted (${res.status}).`);
    } catch (e) {
      fail(e);
      setBusy(null);
      return;
    }
    await loadAll(applied);
  };

  const mark = (decision: Decision) => {
    if (selected.size === 0) return;
    setMarks((m) => ({ ...m, ...Object.fromEntries([...selected].map((id) => [id, decision])) }));
    setSelected(new Set());
  };

  const exit = async () => {
    await fetch("/api/admin/sign-out", { method: "POST" }).catch(() => undefined);
    void navigate("/admin");
  };

  const pending = orders.PENDING ?? [];
  const nonPending = STATUSES.filter((s) => s !== "PENDING").flatMap((s) => orders[s] ?? []);
  const marked = Object.values(marks);
  const approved = marked.filter((m) => m === "APPROVED").length;
  const off = busy !== null;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl leading-8 font-semibold">Orders and sales</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Approve or deny pending orders, review decided ones and see sales by category.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" disabled={off} onClick={refresh}>
            <RefreshCw aria-hidden="true" className="mr-2 size-4" />
            Refresh
          </Button>
          <Button type="button" disabled={off} onClick={() => void commit()}>
            <Check aria-hidden="true" className="mr-2 size-4" />
            Commit {marked.length} decisions
          </Button>
          <Button type="button" variant="outline" disabled={off} onClick={() => setAboutOpen(true)}>
            <Info aria-hidden="true" className="mr-2 size-4" />
            About
          </Button>
          <Button type="button" variant="ghost" disabled={off} onClick={() => void exit()}>
            <LogOut aria-hidden="true" className="mr-2 size-4" />
            Exit
          </Button>
        </div>
      </div>

      {aboutOpen && (
        <div role="dialog" aria-label="About" className="bg-background mb-4 rounded-lg border p-4">
          <p className="text-sm">
            Pet Store Administration. Approve or deny orders and view sales.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setAboutOpen(false)}
          >
            Close
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className="text-muted-foreground mb-2 min-h-5 text-sm">
        {busy === "update" && "Updating data on the server..."}
        {busy === "retrieve" && "Retrieving data from the server..."}
      </div>
      {error && (
        <p
          role="alert"
          className="border-destructive mb-3 flex items-center gap-2 rounded-lg border p-3 text-sm"
        >
          <CircleX aria-hidden="true" className="text-destructive size-4" />
          {error}
        </p>
      )}

      <TabGroup>
        <TabList className="bg-muted mb-4 flex w-fit gap-1 rounded-lg border p-[3px]">
          <Tab className={({ selected: s }) => viewClass(s)}>Orders</Tab>
          <Tab className={({ selected: s }) => viewClass(s)}>Sales</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <TabGroup>
              <TabList className="mb-4 flex gap-6 border-b">
                <Tab className={({ selected: s }) => tabClass(s)}>
                  Pending <Count n={pending.length} />
                </Tab>
                <Tab className={({ selected: s }) => tabClass(s)}>
                  Non-pending <Count n={nonPending.length} />
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <div className="mb-3 flex min-h-9 items-center gap-2">
                    <span className="text-muted-foreground mr-1 text-xs">
                      <b className="text-foreground">{selected.size}</b> selected
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={off}
                      onClick={() => mark("APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={off}
                      onClick={() => mark("DENIED")}
                    >
                      Deny
                    </Button>
                    <span className="text-muted-foreground ml-auto flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <StatusBadge status="PENDING" /> not decided
                      </span>
                      <span className="flex items-center gap-1">
                        <StatusBadge status="APPROVED" /> will be approved
                      </span>
                      <span className="flex items-center gap-1">
                        <StatusBadge status="DENIED" /> will be denied
                      </span>
                    </span>
                  </div>
                  <PendingTable
                    rows={pending}
                    marks={marks}
                    selected={selected}
                    onToggle={(id) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (!n.delete(id)) n.add(id);
                        return n;
                      })
                    }
                    onToggleAll={() =>
                      setSelected((s) =>
                        s.size === pending.length ? new Set() : new Set(pending.map((r) => r.id)),
                      )
                    }
                  />
                  <div className="bg-muted mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm">
                    <span className="bg-primary size-2 rounded-full" aria-hidden="true" />
                    <span>
                      <b>{marked.length} decisions not committed</b>
                      {marked.length > 0 &&
                        ` — ${approved} approved, ${marked.length - approved} denied. No order changes until you commit.`}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {pending.length} pending
                    </span>
                  </div>
                </TabPanel>
                <TabPanel>
                  <OrderTable orders={nonPending} />
                </TabPanel>
              </TabPanels>
            </TabGroup>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <ChartPanel
                id="revenue"
                title="Revenue by category"
                kind="pie"
                data={charts.revenue}
                {...draft}
                disabled={off}
                onChange={setDraft}
                onSubmit={() => void submitRange()}
              />
              <ChartPanel
                id="count"
                title="Orders by category"
                kind="bar"
                data={charts.count}
                {...draft}
                disabled={off}
                onChange={setDraft}
                onSubmit={() => void submitRange()}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <TabGroup>
              <TabList className="mb-4 flex gap-6 border-b">
                <Tab className={({ selected: s }) => tabClass(s)}>Pie chart</Tab>
                <Tab className={({ selected: s }) => tabClass(s)}>Bar chart</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <ChartPanel
                    id="pie"
                    title="Revenue by category"
                    kind="pie"
                    large
                    data={charts.revenue}
                    {...draft}
                    disabled={off}
                    onChange={setDraft}
                    onSubmit={() => void submitRange()}
                  />
                </TabPanel>
                <TabPanel>
                  <ChartPanel
                    id="bar"
                    title="Orders by category"
                    kind="bar"
                    large
                    data={charts.count}
                    {...draft}
                    disabled={off}
                    onChange={setDraft}
                    onSubmit={() => void submitRange()}
                  />
                </TabPanel>
              </TabPanels>
            </TabGroup>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

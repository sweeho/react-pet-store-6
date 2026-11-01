import { ArrowRight, ChevronLeft, Info } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { routeFailure } from "@/errors/routeFailure";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface Contact {
  givenName: string;
  familyName: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  email: string;
  phone: string;
}

interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  productName: string;
  unitPrice: number;
  lineTotal: number;
}

interface CheckoutView {
  locale: string;
  billing: Contact;
  shipping: Contact;
  lines: CartLine[];
  total: number;
}

type Side = "billing" | "shipping";
type Field = keyof Contact;

// Each row of the form: its label key and whether it spans both columns.
const ROWS: { field: Field; full?: boolean; mono?: boolean }[] = [
  { field: "givenName" },
  { field: "familyName" },
  { field: "street", full: true },
  { field: "street2", full: true },
  { field: "city" },
  { field: "state" },
  { field: "zip", mono: true },
  { field: "country" },
  { field: "phone", mono: true },
  { field: "email" },
];
const REQUIRED: Field[] = ROWS.map((r) => r.field).filter((f) => f !== "street2");
const COUNTRIES: [value: string, label: string][] = [
  ["USA", "countryUSA"],
  ["Canada", "countryCanada"],
  ["Japan", "countryJapan"],
  ["China", "countryChina"],
];
const STATES =
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(
    " ",
  );

const inputClass =
  "border-input bg-background focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none";

export default function PetstoreCheckout() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [view, setView] = useState<CheckoutView | null>(null);
  const [form, setForm] = useState<Record<Side, Contact> | null>(null);
  const [problem, setProblem] = useState(false);
  const [busy, setBusy] = useState(false);
  const screen = useScreen("petstore-checkout", view?.locale ?? locale);

  useEffect(() => {
    let live = true;
    fetch("/api/checkout")
      .then(async (r) => {
        if (!live) return;
        if (r.status === 401) {
          void navigate(`/petstore/signin?return=${encodeURIComponent("/petstore/checkout")}`, {
            replace: true,
          });
          return;
        }
        if (!r.ok) {
          void navigate(routeFailure({ kind: "", kinds: [] }));
          return;
        }
        const body = (await r.json()) as CheckoutView;
        if (!live) return;
        setView(body);
        setForm({ billing: body.billing, shipping: body.shipping });
      })
      .catch(() => live && void navigate(routeFailure({ kind: "", kinds: [] })));
    return () => {
      live = false;
    };
  }, [navigate]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  if (!view || !form) return null;
  const shown = view.locale;
  const money = (cents: number) => formatMoney(cents / 100, shown, shown === "ja_JP" ? 0 : 2);

  const set = (side: Side, field: Field, value: string) => {
    setForm({ ...form, [side]: { ...form[side], [field]: value } });
  };

  const submit = async () => {
    if (
      (["billing", "shipping"] as Side[]).some((s) => REQUIRED.some((f) => !form[s][f]?.trim()))
    ) {
      setProblem(true);
      return;
    }
    setProblem(false);
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing: form.billing, shipping: form.shipping }),
    }).catch(() => null);
    if (res?.ok) {
      const { orderId } = (await res.json()) as { orderId: string };
      void navigate("/petstore/order-placed", {
        state: {
          orderId,
          email: form.billing.email.trim(),
          shipping: form.shipping,
          lines: view.lines,
          total: view.total,
          locale: shown,
        },
      });
      return;
    }
    if (res?.status === 401) {
      void navigate(`/petstore/signin?return=${encodeURIComponent("/petstore/checkout")}`);
      return;
    }
    setBusy(false);
    // The server wraps a failure in an h3 error body: the reply is its `data`, and the dev
    // server adds the raw `stack` frames beside it.
    type Reply = { kind?: string; kinds?: string[]; message?: string; trace?: string };
    const body = (await res?.json().catch(() => ({}))) as Reply & {
      stack?: string[];
      data?: Reply;
    };
    const reply: Reply = body?.data ?? body ?? {};
    void navigate(routeFailure({ kind: reply.kind ?? "", kinds: reply.kinds ?? [] }), {
      state: {
        message: reply.message ?? body?.message,
        trace: reply.trace || body?.stack?.join("\n"),
      },
    });
  };

  const countries = (current: string) =>
    COUNTRIES.some(([v]) => v === current) ? COUNTRIES : [...COUNTRIES, [current, current]];

  const section = (side: Side, title: string, sub: string) => (
    <section className="bg-background rounded-lg border p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 mb-4 text-xs">{sub}</p>
      <div className="grid grid-cols-2 gap-3">
        {ROWS.map(({ field, full, mono }) => {
          const id = `${side}-${field}`;
          const value = form[side][field] ?? "";
          const required = REQUIRED.includes(field);
          return (
            <div key={field} className={full ? "col-span-2" : undefined}>
              <div className="mb-1 flex gap-1 text-xs font-medium">
                <label htmlFor={id}>{t[field]}</label>
                {required ? (
                  <i className="text-destructive not-italic" aria-hidden="true">
                    *
                  </i>
                ) : null}
              </div>
              {field === "country" ? (
                <select
                  id={id}
                  className={inputClass}
                  value={value}
                  onChange={(e) => set(side, field, e.target.value)}
                >
                  {countries(value).map(([v, key]) => (
                    <option key={v} value={v}>
                      {t[key] ?? key}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  type={field === "email" ? "email" : "text"}
                  list={field === "state" ? "state-options" : undefined}
                  required={required}
                  aria-required={required}
                  className={`${inputClass}${mono ? "font-mono" : ""}`}
                  value={value}
                  onChange={(e) => set(side, field, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/petstore/cart" className={buttonVariants({ variant: "secondary" })}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t.backToCart}
          </Link>
          <Button type="submit" disabled={busy}>
            {t.placeOrder}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <div className="bg-muted mb-4 flex items-center gap-2 rounded-lg border border-l-[3px] border-l-blue-500 px-3 py-2.5 text-sm">
        <Info aria-hidden="true" className="size-4 text-blue-500" />
        {t.note}
      </div>
      {problem ? (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {t.missing}
        </p>
      ) : null}
      <datalist id="state-options">
        {STATES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_336px] items-start gap-4">
        {section("billing", t.billingTitle, t.billingSub)}
        {section("shipping", t.shippingTitle, t.shippingSub)}
        <aside className="bg-background rounded-lg border p-4" aria-labelledby="summary-title">
          <h2
            id="summary-title"
            className="mb-3 flex items-center justify-between text-base font-semibold"
          >
            {t.yourOrder}
            <Link to="/petstore/cart" className="text-primary text-xs font-normal hover:underline">
              {t.editCart}
            </Link>
          </h2>
          {view.lines.map((l) => (
            <div key={l.itemId} className="flex gap-3 border-t py-3 text-sm">
              <div className="flex-1">
                <b className="block font-medium">{l.name}</b>
                <span className="text-muted-foreground font-mono text-xs">{l.itemId}</span>
                <span className="text-muted-foreground text-xs">
                  {" "}
                  · {t.qty} {l.quantity} × {money(l.unitPrice)}
                </span>
              </div>
              <div className="font-mono">{money(l.lineTotal)}</div>
            </div>
          ))}
          <div className="mt-1 flex items-baseline justify-between border-t pt-3">
            <span className="font-semibold">{t.total}</span>
            <b className="font-mono text-xl font-semibold">{money(view.total)}</b>
          </div>
          <Button type="submit" disabled={busy} className="mt-4 w-full justify-center">
            {t.placeOrder}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <p className="text-muted-foreground mt-3 text-xs">{t.summaryNote}</p>
        </aside>
      </div>
    </form>
  );
}

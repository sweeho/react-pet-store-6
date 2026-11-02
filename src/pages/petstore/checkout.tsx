import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { routeFailure } from "@/errors/routeFailure";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface Party {
  givenName: string;
  familyName: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  unitPrice: number;
  lineTotal: number;
}

interface CartView {
  locale: string;
  lines: CartLine[];
  total: number;
}

const FIELDS: { key: keyof Party; label: string; required: boolean; mono?: boolean }[] = [
  { key: "givenName", label: "givenName", required: true },
  { key: "familyName", label: "familyName", required: true },
  { key: "street", label: "street", required: true },
  { key: "street2", label: "street2", required: false },
  { key: "city", label: "city", required: true },
  { key: "state", label: "state", required: true },
  { key: "zip", label: "zip", required: true, mono: true },
  { key: "country", label: "country", required: true },
  { key: "phone", label: "phone", required: true, mono: true },
  { key: "email", label: "email", required: true },
];
const WIDE: (keyof Party)[] = ["street", "street2"];

const input =
  "border-input bg-background focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none";

export default function Checkout() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const screen = useScreen("checkout", locale);
  const [billing, setBilling] = useState<Party | null>(null);
  const [shipping, setShipping] = useState<Party | null>(null);
  const [cart, setCart] = useState<CartView | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    let live = true;
    const toServerError = (message: string) =>
      void navigate(routeFailure({ kind: "", kinds: [] }), { state: { message, trace: "" } });
    fetch("/api/checkout")
      .then(async (r) => {
        if (!live) return;
        if (r.status === 401) {
          void navigate(`/petstore/signin?return=${encodeURIComponent("/petstore/checkout")}`, {
            replace: true,
          });
          return;
        }
        if (!r.ok) return toServerError(`Checkout could not be loaded (${r.status}).`);
        const body = (await r.json()) as { billing: Party; shipping: Party };
        if (!live) return;
        setBilling({ ...body.billing, street2: body.billing.street2 ?? "" });
        setShipping({ ...body.shipping, street2: body.shipping.street2 ?? "" });
      })
      .catch((e: unknown) => live && toServerError(e instanceof Error ? e.message : String(e)));
    fetch("/api/cart")
      .then((r) => (r.ok ? (r.json() as Promise<CartView>) : null))
      .then((c) => live && setCart(c))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [navigate]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  if (billing === null || shipping === null) return null;
  const shown = cart?.locale ?? locale;
  const money = (cents: number) => formatMoney(cents / 100, shown, shown === "ja_JP" ? 0 : 2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing, shipping }),
    }).catch(() => null);
    if (res?.ok) {
      const { orderId } = (await res.json()) as { orderId: string };
      void navigate("/petstore/order-placed", {
        state: {
          orderId,
          email: billing.email,
          givenName: shipping.givenName,
          familyName: shipping.familyName,
          shipTo: shipping,
          sameAsShipping: JSON.stringify(billing) === JSON.stringify(shipping),
          lines: (cart?.lines ?? []).map((l) => ({
            name: l.name,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
          total: cart?.total ?? 0,
          locale: shown,
          placedAt: Date.now(),
        },
      });
      return;
    }
    setPlacing(false);
    // A route failure arrives as an HTTPError body whose `data` is the failure reply.
    type Reply = { kind?: string; kinds?: string[]; message?: string; trace?: string };
    const raw = (await res?.json().catch(() => ({}))) as Reply & { data?: Reply };
    const body = raw.data ?? raw;
    void navigate(routeFailure({ kind: body.kind ?? "", kinds: body.kinds ?? [] }), {
      state: { message: body.message ?? "The order could not be placed.", trace: body.trace ?? "" },
    });
  };

  const block = (
    name: "billing" | "shipping",
    title: string,
    help: string,
    value: Party,
    set: (p: Party) => void,
  ) => (
    <section className="bg-background rounded-lg border p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mb-4 text-xs">{help}</p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className={WIDE.includes(f.key) ? "col-span-2" : undefined}>
            <label
              htmlFor={`${name}-${f.key}`}
              className={`mb-1 block text-xs font-medium${f.required ? "after:text-destructive after:ml-1 after:content-['*']" : ""}`}
            >
              {t[f.label]}
            </label>
            <input
              id={`${name}-${f.key}`}
              name={`${name}.${f.key}`}
              value={value[f.key]}
              onChange={(e) => set({ ...value, [f.key]: e.target.value })}
              required={f.required}
              className={`${input}${f.mono ? "font-mono" : ""}`}
            />
          </div>
        ))}
      </div>
    </section>
  );

  const placeButton = (
    <Button type="submit" disabled={placing} className="gap-2">
      {placing ? t.placing : t.placeOrder}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Button>
  );

  return (
    <form onSubmit={(e) => void submit(e)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/petstore/cart" className={buttonVariants({ variant: "secondary" })}>
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            {t.backToCart}
          </Link>
          {placeButton}
        </div>
      </div>
      <div className="bg-muted mb-4 flex items-center gap-2 rounded-lg border border-l-[3px] border-l-sky-600 px-3 py-2.5 text-sm">
        <Info className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
        {t.note}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_336px]">
        {block("billing", t.billingTitle, t.billingHelp, billing, setBilling)}
        {block("shipping", t.shippingTitle, t.shippingHelp, shipping, setShipping)}
        <aside className="bg-background rounded-lg border p-4">
          <h2 className="mb-3 flex items-center justify-between text-base font-semibold">
            {t.summaryTitle}
            <Link to="/petstore/cart" className="text-primary text-xs font-medium hover:underline">
              {t.editCart}
            </Link>
          </h2>
          {(cart?.lines ?? []).map((l) => (
            <div
              key={l.itemId}
              className="flex items-start justify-between gap-3 border-t py-3 text-sm"
            >
              <div>
                <b className="font-medium">{l.name}</b>
                <div className="text-muted-foreground text-xs">
                  <span className="font-mono">{l.itemId}</span> · {t.quantityTimes} {l.quantity} ×{" "}
                  {money(l.unitPrice)}
                </div>
              </div>
              <span className="font-mono">{money(l.lineTotal)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t py-3">
            <span className="font-semibold">{t.total}</span>
            <b className="font-mono text-lg">{money(cart?.total ?? 0)}</b>
          </div>
          <div className="mb-3 flex [&>button]:w-full">{placeButton}</div>
          <p className="text-muted-foreground text-xs">{t.small}</p>
        </aside>
      </div>
    </form>
  );
}

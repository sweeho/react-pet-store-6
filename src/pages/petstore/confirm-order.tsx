import { ChevronLeft } from "lucide-react";
import { Link, Navigate } from "react-router";

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

interface ConfirmState {
  billing: Contact;
  shipping: Contact;
  lines: { itemId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  total: number;
  locale: string;
}

const address = (c: Contact) => (
  <>
    {c.givenName} {c.familyName}
    <br />
    {c.street}
    {c.street2 ? `, ${c.street2}` : ""}
    <br />
    {c.city}, {c.state} {c.zip}, {c.country}
    <br />
    {c.phone} · {c.email}
  </>
);

/** Review step: the entered details, then the order is placed on confirmation. */
export default function PetstoreConfirmOrder() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const state = useLocation().state as ConfirmState | null;
  const [busy, setBusy] = useState(false);
  const screen = useScreen("petstore-checkout", state?.locale ?? locale);
  if (!state) return <Navigate to="/petstore/checkout" replace />;
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const shown = state.locale;
  const money = (cents: number) => formatMoney(cents / 100, shown, shown === "ja_JP" ? 0 : 2);

  const confirm = async () => {
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing: state.billing, shipping: state.shipping }),
    }).catch(() => null);
    if (res?.ok) {
      const { orderId } = (await res.json()) as { orderId: string };
      void navigate("/petstore/order-placed", {
        state: {
          orderId,
          email: state.billing.email.trim(),
          shipping: state.shipping,
          lines: state.lines,
          total: state.total,
          locale: shown,
          placedAt: Date.now(),
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

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.confirmTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.confirmSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/petstore/checkout" className={buttonVariants({ variant: "secondary" })}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t.back}
          </Link>
          <Button type="button" disabled={busy} onClick={() => void confirm()}>
            {busy ? t.placing : t.confirmOrder}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_336px] items-start gap-4">
        <section className="bg-background rounded-lg border p-4">
          <h2 className="mb-2 text-base font-semibold">{t.billTo}</h2>
          <p className="text-sm">{address(state.billing)}</p>
        </section>
        <section className="bg-background rounded-lg border p-4">
          <h2 className="mb-2 text-base font-semibold">{t.shipTo}</h2>
          <p className="text-sm">{address(state.shipping)}</p>
        </section>
        <aside className="bg-background rounded-lg border p-4">
          <h2 className="mb-3 text-base font-semibold">{t.yourOrder}</h2>
          {state.lines.map((l) => (
            <div key={l.itemId} className="flex justify-between gap-3 border-t py-3 text-sm">
              <span>
                {l.name} <small className="text-muted-foreground">× {l.quantity}</small>
              </span>
              <span className="font-mono">{money(l.lineTotal)}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="font-semibold">{t.total}</span>
            <b className="font-mono text-xl font-semibold">{money(state.total)}</b>
          </div>
        </aside>
      </div>
    </div>
  );
}

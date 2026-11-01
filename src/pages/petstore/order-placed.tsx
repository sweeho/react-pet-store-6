import { Check } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface PlacedState {
  orderId?: string;
  email?: string;
  locale?: string;
  placedAt?: number;
  total?: number;
  shipping?: {
    givenName: string;
    familyName: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  lines?: { itemId: string; name: string; quantity: number; lineTotal: number }[];
}

export default function PetstoreOrderPlaced() {
  const { locale } = useLocale();
  const state = (useLocation().state ?? {}) as PlacedState;
  const shown = state.locale ?? locale;
  const screen = useScreen("petstore-checkout", shown);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (cents: number) => formatMoney(cents / 100, shown, shown === "ja_JP" ? 0 : 2);
  const [before, after = ""] = t.placedBody.split("{email}");
  const s = state.shipping;
  const steps = [
    ["01", t.step1, t.step1Body],
    ["02", t.step2, t.step2Body],
    ["03", t.step3, t.step3Body],
  ];

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold">{t.placedTitle}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t.placedSubtitle}</p>
        </div>
        <Link to="/petstore" className={buttonVariants()}>
          {t.continueShopping}
        </Link>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_336px] items-start gap-4">
        <section className="bg-background rounded-lg border">
          <div className="flex gap-4 p-6">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
              <Check aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold">{t.complete}</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {before}
                {state.email ? <b className="text-foreground font-medium">{state.email}</b> : null}
                {after}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="font-mono text-3xl font-semibold">{state.orderId}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {t.pending}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t p-6">
            {steps.map(([n, title, body]) => (
              <div key={n} className="text-sm">
                <div className="text-muted-foreground font-mono text-xs">{n}</div>
                <b className="block font-medium">{title}</b>
                <span className="text-muted-foreground">{body}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="bg-background rounded-lg border p-4">
          <h3 className="mb-3 text-base font-semibold">{t.summary}</h3>
          <dl className="grid grid-cols-[72px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t.order}</dt>
            <dd className="font-mono">{state.orderId}</dd>
            {s ? (
              <>
                <dt className="text-muted-foreground">{t.shipTo}</dt>
                <dd>
                  {s.givenName} {s.familyName}
                  <br />
                  {s.street}
                  {s.street2 ? `, ${s.street2}` : ""}
                  <br />
                  {s.city}, {s.state} {s.zip}, {s.country}
                </dd>
              </>
            ) : null}
          </dl>
          {state.lines?.map((l) => (
            <div key={l.itemId} className="mt-2 flex justify-between border-t pt-2 text-sm">
              <span>
                {l.name} <small className="text-muted-foreground">× {l.quantity}</small>
              </span>
              <span className="font-mono">{money(l.lineTotal)}</span>
            </div>
          ))}
          {state.total !== undefined ? (
            <div className="mt-2 flex items-baseline justify-between border-t pt-3">
              <span className="font-semibold">{t.total}</span>
              <b className="font-mono text-xl font-semibold">{money(state.total)}</b>
            </div>
          ) : null}
          <Link
            to="/petstore"
            className={`${buttonVariants({ variant: "secondary", size: "sm" })} mt-4`}
          >
            {t.backHome}
          </Link>
        </aside>
      </div>
    </div>
  );
}

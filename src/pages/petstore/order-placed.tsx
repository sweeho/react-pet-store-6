import { Check, LayoutGrid } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface Placed {
  orderId: string;
  email: string;
  givenName: string;
  familyName: string;
  shipTo: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  sameAsShipping: boolean;
  lines: { name: string; quantity: number; lineTotal: number }[];
  total: number;
  locale: string;
  placedAt: number;
}

export default function OrderPlaced() {
  const { locale } = useLocale();
  const placed = (useLocation().state ?? null) as Placed | null;
  const shown = placed?.locale ?? locale;
  const screen = useScreen("order-placed", shown);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (cents: number) => formatMoney(cents / 100, shown, shown === "ja_JP" ? 0 : 2);

  if (!placed)
    return (
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">{t.none}</p>
        <Link to="/petstore" className={buttonVariants()}>
          {t.continueShopping}
        </Link>
      </div>
    );

  const steps = [
    [t.step1, t.step1Help],
    [t.step2, t.step2Help],
    [t.step3, t.step3Help],
  ];
  const address = placed.shipTo;
  return (
    <div>
      <p className="text-muted-foreground mb-2 text-xs">{t.breadcrumb}</p>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.thanks}</p>
        </div>
        <Link to="/petstore" className={buttonVariants()}>
          <LayoutGrid className="mr-2 size-4" aria-hidden="true" />
          {t.continueShopping}
        </Link>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
        <section className="bg-background rounded-lg border p-6">
          <div className="flex gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
              <Check className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.numberTitle}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {t.numberHelp} <b className="text-foreground font-medium">{placed.email}</b>{" "}
                {t.numberHelpEnd}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="font-mono text-3xl font-semibold">{placed.orderId}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  {t.status}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t pt-4 sm:grid-cols-3">
            {steps.map(([name, help], i) => (
              <div key={name} className="text-sm">
                <div className="text-muted-foreground font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <b className="font-medium">{name}</b>
                <p className="text-muted-foreground text-xs">{help}</p>
              </div>
            ))}
          </div>
        </section>
        <aside className="bg-background rounded-lg border p-4">
          <h3 className="mb-3 text-base font-semibold">{t.summaryTitle}</h3>
          <dl className="grid grid-cols-[72px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t.order}</dt>
            <dd className="font-mono">{placed.orderId}</dd>
            <dt className="text-muted-foreground">{t.placed}</dt>
            <dd>{new Date(placed.placedAt).toLocaleString(shown.replace("_", "-"))}</dd>
            <dt className="text-muted-foreground">{t.shipTo}</dt>
            <dd>
              {placed.givenName} {placed.familyName}
              <br />
              {address.street}
              {address.street2 ? `, ${address.street2}` : ""}
              <br />
              {address.city}, {address.state} {address.zip}, {address.country}
            </dd>
            {placed.sameAsShipping ? (
              <>
                <dt className="text-muted-foreground">{t.billTo}</dt>
                <dd>{t.sameAsShipping}</dd>
              </>
            ) : null}
          </dl>
          <div className="mt-4">
            {placed.lines.map((l, i) => (
              <div key={i} className="flex justify-between border-t py-2 text-sm">
                <span>
                  {l.name} <small className="text-muted-foreground">× {l.quantity}</small>
                </span>
                <span className="font-mono">{money(l.lineTotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t py-3">
              <span className="font-semibold">{t.total}</span>
              <b className="font-mono text-lg">{money(placed.total)}</b>
            </div>
          </div>
          <Link to="/petstore" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            {t.backHome}
          </Link>
        </aside>
      </div>
    </div>
  );
}

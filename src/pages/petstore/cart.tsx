import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import { useLocale } from "@/components/storefront/LocaleProvider";
import PetTipsBanner from "@/components/storefront/PetTipsBanner";
import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  unitPrice: number;
}

interface CartView {
  locale: string;
  lines: CartLine[];
  total: number;
}

const EMPTY: CartView = { locale: "en_US", lines: [], total: 0 };

export default function PetstoreCart() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-cart", locale);
  const [cart, setCart] = useState<CartView>(EMPTY);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const apply = (view: CartView) => {
    setCart(view);
    setEdits({});
  };
  const send = (url: string, init?: RequestInit) =>
    fetch(url, init)
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((v: CartView) => apply(v))
      .catch(() => apply(EMPTY));

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then((v: CartView) => apply(v))
      .catch(() => apply(EMPTY));
  }, [locale]);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (hundredths: number) =>
    formatMoney(hundredths / 100, locale, locale === "ja_JP" ? 0 : 2);

  const update = () => {
    const quantities: Record<string, number> = {};
    for (const l of cart.lines) quantities[l.itemId] = Number(edits[l.itemId] ?? l.quantity);
    void send("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantities }),
    });
  };

  return (
    <div>
      <PetTipsBanner screen="cart" />
      <h1 className="mb-4 text-2xl font-semibold">{t.title}</h1>
      {cart.lines.length > 0 ? (
        <form
          className="overflow-hidden rounded-lg border"
          onSubmit={(e) => {
            e.preventDefault();
            update();
          }}
        >
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-muted-foreground text-xs font-semibold">
              <tr>
                <th className="h-10 px-4 text-left">{t.item}</th>
                <th className="h-10 w-36 px-4 text-right">{t.quantity}</th>
                <th className="h-10 w-40 px-4 text-right">{t.unitPrice}</th>
                <th className="h-10 w-32 px-4 text-right">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.lines.map((l) => (
                <tr key={l.itemId} className="border-t">
                  <td className="h-14 px-4">
                    <Link
                      to={`/petstore/item/${l.itemId}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">{l.itemId}</span>
                    {l.attribute && <span className="text-muted-foreground"> · {l.attribute}</span>}
                  </td>
                  <td className="px-4 text-right">
                    <input
                      type="number"
                      aria-label={`${t.quantity}: ${l.name}`}
                      className="h-8 w-[72px] rounded border px-2 text-right font-mono text-sm"
                      value={edits[l.itemId] ?? String(l.quantity)}
                      onChange={(e) => setEdits({ ...edits, [l.itemId]: e.target.value })}
                    />
                  </td>
                  <td className="px-4 text-right font-mono">{money(l.unitPrice)}</td>
                  <td className="px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${t.remove} ${l.name}`}
                      onClick={() =>
                        void send(`/api/cart/items/${encodeURIComponent(l.itemId)}`, {
                          method: "DELETE",
                        })
                      }
                    >
                      {t.remove}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t p-4">
            <Button type="submit" variant="outline">
              {t.updateCart}
            </Button>
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground">{t.total}</span>
              <span className="font-mono text-xl font-medium">{money(cart.total)}</span>
              <Button asChild>
                <Link to="/petstore/checkout">{t.checkOut}</Link>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground border-t p-3 text-xs">{t.hint}</p>
        </form>
      ) : (
        <EmptyFrame
          message={t.message}
          action={
            <Link to="/" className="text-primary text-sm font-medium hover:underline">
              Back to home
            </Link>
          }
        />
      )}
    </div>
  );
}

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
  lines: CartLine[];
  total: number;
}

const EMPTY_VIEW: CartView = { lines: [], total: 0 };

export default function PetstoreCart() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-cart", locale);
  const [cart, setCart] = useState<CartView>(EMPTY_VIEW);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const show = (view: CartView) => {
    setCart(view);
    setEdits({});
  };
  const send = (url: string, init?: RequestInit) =>
    fetch(url, init)
      .then((r) => (r.ok ? (r.json() as Promise<CartView>) : EMPTY_VIEW))
      .then(show)
      .catch(() => show(EMPTY_VIEW));

  useEffect(() => {
    void send("/api/cart");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on locale change only
  }, [locale]);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (cents: number) => formatMoney(cents / 100, locale, locale === "ja_JP" ? 0 : 2);

  const update = () => {
    const quantities = Object.fromEntries(
      cart.lines.map((l) => [l.itemId, Number(edits[l.itemId] ?? l.quantity)]),
    );
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
        <div>
          <table className="w-full rounded-md border text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="p-3">{t.item}</th>
                <th className="p-3">{t.quantity}</th>
                <th className="p-3">{t.unitPrice}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {cart.lines.map((l) => (
                <tr key={l.itemId}>
                  <td className="p-3">
                    <Link
                      to={`/petstore/item/${l.itemId}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    <span className="text-muted-foreground block font-mono text-xs">
                      {l.itemId}
                    </span>
                    {l.attribute && (
                      <span className="text-muted-foreground block">{l.attribute}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      aria-label={`${t.quantity} ${l.name}`}
                      className="w-20 rounded-md border px-2 py-1"
                      value={edits[l.itemId] ?? String(l.quantity)}
                      onChange={(e) => setEdits({ ...edits, [l.itemId]: e.target.value })}
                    />
                  </td>
                  <td className="p-3">{money(l.unitPrice)}</td>
                  <td className="p-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
          <div className="mt-4 flex items-center justify-between">
            <Button type="button" onClick={update}>
              {t.update}
            </Button>
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                {t.total}: {money(cart.total)}
              </span>
              <Link
                to="/petstore/checkout"
                className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
              >
                {t.checkout}
              </Link>
            </div>
          </div>
        </div>
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

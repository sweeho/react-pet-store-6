import { ArrowRight, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router";

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

export default function PetstoreCart() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-cart", locale);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [version, setVersion] = useState(0);
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : { lines: [] }))
      .then((c: { lines: CartLine[] }) => {
        setLines(c.lines);
        setDrafts(Object.fromEntries(c.lines.map((l) => [l.itemId, String(l.quantity)])));
      })
      .catch(() => setLines([]));
  }, [locale, version]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (cents: number) => formatMoney(cents / 100, locale, locale === "ja_JP" ? 0 : 2);
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const remove = async (itemId: string) => {
    await fetch(`/api/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
    setVersion((v) => v + 1);
  };
  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantities: drafts }),
    });
    setVersion((v) => v + 1);
  };

  return (
    <div>
      <PetTipsBanner screen="cart" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.intro}</p>
      </div>
      {lines.length > 0 ? (
        <>
          <form onSubmit={(e) => void update(e)} className="overflow-hidden rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground h-10 text-left text-xs font-semibold">
                  <th className="px-4">{t.item}</th>
                  <th className="w-36 px-4 text-right">{t.quantity}</th>
                  <th className="w-40 px-4 text-right">{t.unitPrice}</th>
                  <th className="w-32 px-4 text-right">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.itemId} className="h-14 border-t">
                    <td className="px-4">
                      <Link
                        to={`/petstore/item/${l.itemId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {l.attribute ? `${l.attribute} ${l.name}` : l.name}
                      </Link>{" "}
                      <span className="text-muted-foreground font-mono text-xs">{l.itemId}</span>
                    </td>
                    <td className="px-4 text-right">
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`${t.quantityFor} ${l.name}`}
                        value={drafts[l.itemId] ?? String(l.quantity)}
                        onChange={(e) => setDrafts({ ...drafts, [l.itemId]: e.target.value })}
                        className="h-8 w-[72px] rounded border px-2 text-right font-mono text-[13px]"
                      />
                    </td>
                    <td className="px-4 text-right font-mono text-[13px]">{money(l.unitPrice)}</td>
                    <td className="px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`${t.remove} ${l.name}`}
                        onClick={() => void remove(l.itemId)}
                      >
                        <Trash2 aria-hidden="true" />
                        {t.remove}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t p-4">
              <Button type="submit" variant="outline">
                <RefreshCw aria-hidden="true" />
                {t.update}
              </Button>
              <div className="flex items-center gap-6">
                <span className="text-muted-foreground">{t.total}</span>
                <span className="font-mono text-xl font-medium">{money(total)}</span>
                <Button asChild>
                  <Link to="/petstore/checkout">
                    {t.checkOut}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </form>
          <p className="text-muted-foreground mt-3 text-xs">{t.hint}</p>
        </>
      ) : (
        <div className="rounded-lg border px-6 py-12 text-center">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 grid size-12 place-items-center rounded-full">
            <ShoppingCart className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mb-1 text-base font-semibold">{t.message}</h2>
          <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm">{t.emptyHelp}</p>
          <div className="flex justify-center gap-2">
            <Button asChild>
              <Link to="/petstore">{t.browse}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">{t.home}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

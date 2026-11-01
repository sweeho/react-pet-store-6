import { RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import { useLocale } from "@/components/storefront/LocaleProvider";
import PetTipsBanner from "@/components/storefront/PetTipsBanner";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { routeFailure } from "@/errors/routeFailure";
import { useScreen } from "@/locales/useScreen";
import { formatMoney } from "../../../shared/i18n/format";

interface CartLine {
  itemId: string;
  quantity: number;
  name: string;
  attribute: string;
  productName: string;
  unitPrice: number;
  lineTotal: number;
}

interface CartView {
  lines: CartLine[];
  total: number;
}

export default function PetstoreCart() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const screen = useScreen("petstore-cart", locale);
  const [view, setView] = useState<CartView | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /** Shows a cart reply; a failure goes to the error page its kind maps to. */
  const receive = useCallback(
    async (res: Response) => {
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { kind?: string; kinds?: string[] };
        void navigate(routeFailure({ kind: body.kind ?? "", kinds: body.kinds ?? [] }));
        return;
      }
      const next = (await res.json()) as CartView;
      setView(next);
      setDrafts(Object.fromEntries(next.lines.map((l) => [l.itemId, String(l.quantity)])));
    },
    [navigate],
  );
  const send = (url: string, init?: RequestInit) =>
    fetch(url, init)
      .then(receive)
      .catch(() => void navigate(routeFailure({ kind: "", kinds: [] })));

  useEffect(() => {
    fetch("/api/cart")
      .then(receive)
      .catch(() => void navigate(routeFailure({ kind: "", kinds: [] })));
  }, [locale, receive, navigate]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const money = (cents: number) => formatMoney(cents / 100, locale, locale === "ja_JP" ? 0 : 2);

  return (
    <div>
      <PetTipsBanner screen="cart" />
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
      </div>
      {view === null ? null : view.lines.length === 0 ? (
        <EmptyFrame
          title={t.title}
          message={t.message}
          action={
            <>
              <Link to="/petstore" className={buttonVariants()}>
                {t.browse}
              </Link>
              <Link to="/" className={buttonVariants({ variant: "secondary" })}>
                {t.backHome}
              </Link>
            </>
          }
        />
      ) : (
        <>
          <form
            className="bg-background overflow-hidden rounded-lg border"
            onSubmit={(e) => {
              e.preventDefault();
              const quantities = Object.fromEntries(
                Object.entries(drafts).map(([id, v]) => [id, Number(v.trim())]),
              );
              void send("/api/cart", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantities }),
              });
            }}
          >
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground text-left text-xs font-semibold">
                  <th className="h-10 px-4">{t.item}</th>
                  <th className="w-36 px-4 text-right">{t.quantity}</th>
                  <th className="w-40 px-4 text-right">{t.unitPrice}</th>
                  <th className="w-28 px-4 text-right">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.lines.map((l) => (
                  <tr key={l.itemId} className="border-t">
                    <td className="h-14 px-4">
                      <Link
                        to={`/petstore/item/${l.itemId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {l.name}
                      </Link>
                      <span className="text-muted-foreground">
                        {" "}
                        · {l.productName}
                        {l.attribute ? ` · ${l.attribute}` : ""}
                      </span>
                    </td>
                    <td className="px-4 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`${t.quantityFor} ${l.name}`}
                        value={drafts[l.itemId] ?? String(l.quantity)}
                        onChange={(e) => setDrafts({ ...drafts, [l.itemId]: e.target.value })}
                        className="border-input bg-background focus-visible:ring-ring h-8 w-[72px] rounded border px-2 text-right font-mono text-sm focus-visible:ring-2 focus-visible:outline-none"
                      />
                    </td>
                    <td className="px-4 text-right font-mono">{money(l.unitPrice)}</td>
                    <td className="px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 px-2 text-xs"
                        aria-label={`${t.remove} ${l.name}`}
                        onClick={() =>
                          void send(`/api/cart/items/${encodeURIComponent(l.itemId)}`, {
                            method: "DELETE",
                          })
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        {t.remove}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t p-4">
              <Button type="submit" variant="outline">
                <RefreshCw aria-hidden="true" className="mr-2 size-4" />
                {t.updateCart}
              </Button>
              <div className="flex items-center gap-6">
                <span className="text-muted-foreground">{t.total}</span>
                <span className="font-mono text-xl font-medium">{money(view.total)}</span>
                <Link to="/petstore/checkout" className={buttonVariants()}>
                  {t.checkOut}
                </Link>
              </div>
            </div>
          </form>
          <p className="text-muted-foreground mt-3 text-xs">{t.hint}</p>
        </>
      )}
    </div>
  );
}

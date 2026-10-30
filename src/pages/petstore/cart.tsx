import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import { useLocale } from "@/components/storefront/LocaleProvider";
import PetTipsBanner from "@/components/storefront/PetTipsBanner";
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
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => (r.ok ? r.json() : { lines: [] }))
      .then((c: { lines: CartLine[] }) => setLines(c.lines))
      .catch(() => setLines([]));
  }, [locale]);
  if ("error" in screen) return screen.error;
  const { title, message } = screen.definition;

  return (
    <div>
      <PetTipsBanner screen="cart" />
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      {lines.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {lines.map((l) => (
            <li key={l.itemId} className="flex items-center justify-between gap-4 p-3 text-sm">
              <span>
                <span className="font-medium">{l.name}</span>
                <span className="text-muted-foreground font-mono text-xs"> {l.itemId}</span>
                {l.attribute && <span className="text-muted-foreground"> · {l.attribute}</span>}
              </span>
              <span>
                {l.quantity} × {formatMoney(l.unitPrice / 100, locale, locale === "ja_JP" ? 0 : 2)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyFrame
          message={message}
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

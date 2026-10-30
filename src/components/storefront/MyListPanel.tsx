import { Link, useLocation } from "react-router";

import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

interface MyListItem {
  productId: string;
  name: string;
}

/** Up to ten products of the favourite category; renders nothing while MyList is off (SWHR2-R-0053). */
export default function MyListPanel() {
  const { locale } = useLocale();
  // The panel lives in the layout, so re-read after each client-side navigation (e.g. right after sign-up).
  const { pathname } = useLocation();
  const text = useScreen("account", locale);
  const [items, setItems] = useState<MyListItem[]>([]);

  useEffect(() => {
    let live = true;
    fetch(`/api/account/my-list?locale=${encodeURIComponent(locale)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ items: MyListItem[] }>) : { items: [] }))
      .then((d) => live && setItems(d.items.filter((p) => typeof p.productId === "string")))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [locale, pathname]);

  if (items.length === 0 || "error" in text) return null;
  const t = text.definition;

  return (
    <div className="bg-background w-full shrink-0 rounded-lg border lg:w-72">
      <section data-testid="my-list" aria-label={t.myListTitle}>
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">{t.myListTitle}</h2>
          <p className="text-muted-foreground text-xs">{t.myListFrom}</p>
        </div>
        <ul>
          {items.map((p) => (
            <li
              key={p.productId}
              className="flex items-center justify-between gap-2 border-b px-4 py-2"
            >
              <Link to={`/petstore/product/${p.productId}`} className="text-sm hover:underline">
                {p.name}
              </Link>
              <span className="text-muted-foreground font-mono text-xs">{p.productId}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-muted-foreground p-3 text-xs">
        {t.myListFooter}{" "}
        <Link to="/petstore/account" className="text-primary hover:underline">
          {t.myListChange}
        </Link>
      </p>
    </div>
  );
}

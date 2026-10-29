import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router";

import AddToCart from "@/components/storefront/AddToCart";
import ApiView from "@/components/storefront/ApiView";
import CatalogImage from "@/components/storefront/CatalogImage";
import { type ItemData, apiUrl, money } from "@/components/storefront/catalogApi";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { useScreen } from "@/locales/useScreen";

export default function ItemPage() {
  const { itemId = "" } = useParams();
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;

  return (
    <ApiView<ItemData> url={apiUrl(`/api/catalog/items/${encodeURIComponent(itemId)}`, locale)}>
      {(item) => (
        <div>
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"
          >
            <Link to="/">{t.home}</Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <Link to={`/petstore/product/${item.productId}`}>{item.name}</Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="text-foreground font-medium">{item.description}</span>
          </nav>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
            <CatalogImage
              image={item.image}
              alt={item.description}
              className="bg-muted/40 aspect-square w-full rounded-lg border object-contain"
            />
            <div>
              <h1 className="text-2xl font-semibold">{item.description}</h1>
              <p className="text-muted-foreground mt-1">{item.name}</p>
              <div className="my-6 grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg border p-4">
                  <div className="text-muted-foreground text-xs font-medium">{t.listPrice}</div>
                  <div className="mt-1 font-mono text-2xl">{money(item.listPrice, locale)}</div>
                </div>
                <div className="border-primary bg-background rounded-lg border p-4">
                  <div className="text-muted-foreground text-xs font-medium">{t.yourPrice}</div>
                  <div className="text-primary mt-1 font-mono text-2xl">
                    {money(item.unitCost, locale)}
                  </div>
                </div>
              </div>
              <AddToCart itemId={item.itemId} />
              <dl className="mt-6 grid grid-cols-[120px_1fr] border-t text-sm">
                <dt className="text-muted-foreground flex h-10 items-center border-b text-xs font-medium">
                  {t.itemId}
                </dt>
                <dd className="flex h-10 items-center border-b font-mono">{item.itemId}</dd>
                <dt className="text-muted-foreground flex h-10 items-center border-b text-xs font-medium">
                  {t.product}
                </dt>
                <dd className="flex h-10 items-center gap-2 border-b">
                  <Link
                    to={`/petstore/product/${item.productId}`}
                    className="text-primary font-medium"
                  >
                    {item.name}
                  </Link>
                  <span className="text-muted-foreground font-mono text-xs">{item.productId}</span>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      )}
    </ApiView>
  );
}

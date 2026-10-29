import { ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import AddToCart from "@/components/storefront/AddToCart";
import ApiView from "@/components/storefront/ApiView";
import CatalogImage from "@/components/storefront/CatalogImage";
import {
  type CatalogPageData,
  type ItemData,
  type ProductData,
  apiUrl,
  money,
} from "@/components/storefront/catalogApi";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";

export default function ProductPage() {
  const { productId = "" } = useParams();
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const id = encodeURIComponent(productId);

  return (
    <div>
      <ApiView<ProductData> url={apiUrl(`/api/catalog/products/${id}`, locale)}>
        {(product) => (
          <>
            <nav
              aria-label="Breadcrumb"
              className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"
            >
              <Link to="/">{t.home}</Link>
              <ChevronRight className="size-3" aria-hidden="true" />
              <Link to={`/petstore/category/${product.categoryId}`}>{product.categoryId}</Link>
              <ChevronRight className="size-3" aria-hidden="true" />
              <span className="text-foreground font-medium">{product.name}</span>
            </nav>
            <div className="mb-6 flex items-end justify-between gap-6">
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              <Button asChild variant="outline">
                <Link to={`/petstore/category/${product.categoryId}`}>
                  {t.allOf} {product.categoryId}
                </Link>
              </Button>
            </div>
            <div className="bg-background mb-6 flex items-center gap-4 rounded-lg border p-4">
              <CatalogImage
                image={product.image}
                alt=""
                className="size-24 rounded-lg border object-contain"
              />
              <div>
                <p className="text-muted-foreground text-sm">{product.description}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {t.product} <span className="text-foreground font-mono">{product.productId}</span>
                  {" · "}
                  {t.category} <span className="text-foreground">{product.categoryId}</span>
                </p>
              </div>
            </div>
          </>
        )}
      </ApiView>
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        {t.items}
      </h2>
      <ApiView<CatalogPageData<ItemData>> url={apiUrl(`/api/catalog/products/${id}/items`, locale)}>
        {(page) =>
          page.items.length === 0 ? (
            <EmptyFrame message={t.emptyProduct} />
          ) : (
            <div className="bg-background overflow-hidden rounded-lg border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs font-semibold">
                  <tr>
                    <th className="h-10 px-4">{t.item}</th>
                    <th className="px-4">{t.itemId}</th>
                    <th className="px-4 text-right">{t.listPrice}</th>
                    <th className="px-4 text-right">{t.yourPrice}</th>
                    <th className="px-4">
                      <span className="sr-only">{t.addToCart}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((item) => (
                    <tr key={item.itemId} className="border-t">
                      <td className="h-12 px-4">
                        <Link
                          to={`/petstore/item/${item.itemId}`}
                          className="flex items-center gap-3 font-medium"
                        >
                          <CatalogImage
                            image={item.image}
                            alt=""
                            className="size-8 rounded border object-contain"
                          />
                          {item.description}
                        </Link>
                      </td>
                      <td className="px-4 font-mono text-xs">{item.itemId}</td>
                      <td className="text-muted-foreground px-4 text-right font-mono">
                        {money(item.listPrice, locale)}
                      </td>
                      <td className="px-4 text-right font-mono font-medium">
                        {money(item.unitCost, locale)}
                      </td>
                      <td className="px-4 text-right">
                        <AddToCart itemId={item.itemId} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </ApiView>
    </div>
  );
}

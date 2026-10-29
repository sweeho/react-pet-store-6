import { ChevronRight } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import ApiView from "@/components/storefront/ApiView";
import CatalogImage from "@/components/storefront/CatalogImage";
import {
  type CatalogPageData,
  type CategoryData,
  type ProductData,
  apiUrl,
} from "@/components/storefront/catalogApi";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";

const PAGE_SIZE = 2;

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const [params] = useSearchParams();
  const start = Math.max(Number(params.get("start")) || 0, 0);
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const base = `/petstore/category/${categoryId}`;

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"
      >
        <Link to="/">{t.home}</Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="text-foreground font-medium">{categoryId}</span>
      </nav>
      <ApiView<CategoryData>
        url={apiUrl(`/api/catalog/categories/${encodeURIComponent(categoryId)}`, locale)}
      >
        {(category) => <h1 className="mb-6 text-2xl font-semibold">{category.name}</h1>}
      </ApiView>
      <ApiView<CatalogPageData<ProductData>>
        url={apiUrl(`/api/catalog/categories/${encodeURIComponent(categoryId)}/products`, locale, {
          start,
          size: PAGE_SIZE,
        })}
      >
        {(page) =>
          page.items.length === 0 ? (
            <EmptyFrame message={t.emptyCategory} />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {page.items.map((p) => (
                  <li key={p.productId}>
                    <Link
                      to={`/petstore/product/${p.productId}`}
                      className="bg-background focus-visible:outline-ring block overflow-hidden rounded-lg border outline-none hover:shadow-md focus-visible:outline-2"
                    >
                      <CatalogImage
                        image={p.image}
                        alt=""
                        className="bg-muted/40 h-64 w-full border-b object-contain"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-base font-semibold">{p.name}</div>
                            <div className="text-muted-foreground font-mono text-xs">
                              {p.productId}
                            </div>
                          </div>
                          <span className="text-sm font-medium">{t.viewItems}</span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">{p.description}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {t.products} {page.start + 1}–{page.start + page.items.length}
                </span>
                <span className="flex gap-2">
                  {page.hasPrevious ? (
                    <Button asChild variant="outline">
                      <Link to={`${base}?start=${page.previousStart}`}>{t.previous}</Link>
                    </Button>
                  ) : null}
                  {page.hasNext ? (
                    <Button asChild variant="outline">
                      <Link to={`${base}?start=${page.nextStart}`}>{t.next}</Link>
                    </Button>
                  ) : null}
                </span>
              </div>
            </>
          )
        }
      </ApiView>
    </div>
  );
}

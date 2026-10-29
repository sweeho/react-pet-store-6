import { ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import AddToCart from "@/components/storefront/AddToCart";
import ApiView from "@/components/storefront/ApiView";
import CatalogImage from "@/components/storefront/CatalogImage";
import {
  type CatalogPageData,
  type ItemData,
  apiUrl,
  money,
} from "@/components/storefront/catalogApi";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";

const PAGE_SIZE = 10;

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const start = Math.max(Number(params.get("start")) || 0, 0);
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  const base = `/petstore/search?q=${encodeURIComponent(q)}`;

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-2 flex items-center gap-1 text-xs"
      >
        <Link to="/">{t.home}</Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span className="text-foreground font-medium">{t.searchLabel}</span>
      </nav>
      <h1 className="mb-1 text-2xl font-semibold">{t.searchTitle}</h1>
      {q.trim() ? (
        <p className="text-muted-foreground mb-6 flex flex-wrap items-center gap-1 text-sm">
          {q
            .trim()
            .split(/\s+/)
            .map((kw, i) => (
              <span
                key={`${kw}-${i}`}
                className="text-primary rounded-full border px-2 font-mono text-xs"
              >
                {kw}
              </span>
            ))}
        </p>
      ) : null}
      <ApiView<CatalogPageData<ItemData>>
        url={apiUrl("/api/catalog/search", locale, { q, start, size: PAGE_SIZE })}
      >
        {(page) =>
          page.items.length === 0 ? (
            <EmptyFrame message={t.noResults} />
          ) : (
            <>
              <div className="bg-background overflow-hidden rounded-lg border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-muted-foreground text-left text-xs font-semibold">
                    <tr>
                      <th className="h-10 px-4">{t.item}</th>
                      <th className="px-4">{t.itemId}</th>
                      <th className="px-4">{t.product}</th>
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
                        <td className="px-4">
                          <Link to={`/petstore/product/${item.productId}`}>{item.name}</Link>
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
              <div className="mt-4 flex justify-end gap-2">
                {page.hasPrevious ? (
                  <Button asChild variant="outline">
                    <Link to={`${base}&start=${page.previousStart}`}>{t.previous}</Link>
                  </Button>
                ) : null}
                {page.hasNext ? (
                  <Button asChild variant="outline">
                    <Link to={`${base}&start=${page.nextStart}`}>{t.next}</Link>
                  </Button>
                ) : null}
              </div>
            </>
          )
        }
      </ApiView>
    </div>
  );
}

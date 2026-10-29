import { Link } from "react-router";

import { useScreen } from "@/locales/useScreen";

import ApiView from "./ApiView";
import { type CatalogPageData, type CategoryData, apiUrl } from "./catalogApi";
import { useLocale } from "./LocaleProvider";

/** The category side panel: the page's only complementary landmark. */
export default function CategoryPanel() {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const label = "error" in screen ? "Categories" : screen.definition.panelLabel;

  return (
    <aside aria-label={label} className="w-full shrink-0 lg:w-48">
      <h2 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wide uppercase">
        {label}
      </h2>
      <ApiView<CatalogPageData<CategoryData>>
        url={apiUrl("/api/catalog/categories", locale, { start: 0, size: 100 })}
      >
        {(page) => (
          <ul className="flex flex-col">
            {page.items.map((c) => (
              <li key={c.categoryId}>
                <Link
                  to={`/petstore/category/${c.categoryId}`}
                  className="hover:bg-accent focus-visible:outline-ring flex h-8 items-center rounded-lg px-2 text-sm font-medium outline-none focus-visible:outline-2"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ApiView>
    </aside>
  );
}

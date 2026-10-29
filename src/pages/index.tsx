import { ChevronRight, LayoutGrid, Lock } from "lucide-react";
import { Link } from "react-router";

import { areas } from "@/components/shell/areas";
import CategoryPanel from "@/components/storefront/CategoryPanel";
import PetMap from "@/components/storefront/PetMap";

const STAFF_ROUTES = ["/admin", "/supplier"];
const CATALOG_ROUTE = "/petstore";

// One card per distinct route, so each primary-area route is linked exactly once. The catalog
// route is linked by the call to action instead of its card.
const routes = [...new Set(areas.map((area) => area.to))].map((to) => ({
  to,
  labels: areas.filter((area) => area.to === to).map((area) => area.label),
  staff: STAFF_ROUTES.includes(to),
}));

export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
      <CategoryPanel />
      <div className="min-w-0 flex-1">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl leading-8 font-semibold">Welcome to Pet Store</h1>
            <p className="text-muted-foreground mt-1">
              Pick an area to get started, or browse the whole catalog.
            </p>
          </div>
          <Link
            to={CATALOG_ROUTE}
            className="bg-primary text-primary-foreground focus-visible:outline-ring inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium outline-none hover:opacity-90 focus-visible:outline-2"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
            Browse the catalog
          </Link>
        </div>
        <div className="mb-8">
          <PetMap />
        </div>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          Everything in the store
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map(({ to, labels, staff }) => {
            const body = (
              <>
                <div className="flex items-center justify-between font-semibold">
                  {labels[0]}
                  {to === CATALOG_ROUTE ? null : (
                    <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
                  )}
                </div>
                {labels.length > 1 ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {labels.slice(1).join(" · ")}
                  </p>
                ) : null}
                {staff ? (
                  <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <Lock className="size-3" aria-hidden="true" />
                    Staff sign-in
                  </p>
                ) : null}
              </>
            );
            return (
              <li key={to}>
                {to === CATALOG_ROUTE ? (
                  <div className="bg-background rounded-lg border p-4">{body}</div>
                ) : (
                  <Link
                    to={to}
                    className="bg-background hover:bg-accent focus-visible:outline-ring block rounded-lg border p-4 outline-none focus-visible:outline-2"
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

import {
  BarChart3,
  CheckSquare,
  CreditCard,
  Globe,
  LayoutGrid,
  LogIn,
  type LucideIcon,
  Package,
  ShoppingCart,
  User,
} from "lucide-react";
import { Link } from "react-router";

import { NAV_AREAS } from "@/constants/navigation";

const AREA_ICONS: Record<string, LucideIcon> = {
  "catalog-browsing": LayoutGrid,
  "shopping-cart": ShoppingCart,
  checkout: CreditCard,
  localization: Globe,
  "sign-on": LogIn,
  "customer-account": User,
  "order-approval": CheckSquare,
  "sales-reporting": BarChart3,
  "supplier-inventory": Package,
};

const Home = () => {
  return (
    <main className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Welcome to Pet Store</h1>
        <p className="text-muted-foreground mt-1">
          Pick an area to get started, from browsing the catalog to store administration.
        </p>
      </div>
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Everything in the store
      </h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {NAV_AREAS.map((area) => {
          const Icon = AREA_ICONS[area.key] ?? LayoutGrid;
          return (
            <li key={area.key}>
              <Link
                to={area.href}
                className="border-border bg-background hover:bg-card focus-visible:ring-ring flex h-full items-start gap-3 rounded-lg border p-4 focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="border-border bg-card text-primary grid size-8 flex-none place-items-center rounded-lg border">
                  <Icon aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    {area.label}
                    {area.staff && (
                      <span className="border-border bg-card text-muted-foreground inline-flex h-[22px] items-center rounded-full border px-2 text-xs font-medium">
                        Staff sign-in
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs/[18px]">{area.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
};

export default Home;

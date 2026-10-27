import {
  BarChart3,
  CheckSquare,
  CreditCard,
  Globe,
  Home,
  LayoutGrid,
  Lock,
  LogIn,
  type LucideIcon,
  Package,
  ShoppingCart,
  User,
} from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/utils/cn";

import { NAV_AREAS, type NavGroup, type NavIcon } from "../../constants/navigation";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  catalog: LayoutGrid,
  cart: ShoppingCart,
  checkout: CreditCard,
  signin: LogIn,
  account: User,
  language: Globe,
  approval: CheckSquare,
  reporting: BarChart3,
  inventory: Package,
};

const GROUPS: readonly NavGroup[] = ["Shop", "You", "Store staff"];

export default function GlobalNav() {
  return (
    <nav
      aria-label="Global"
      className="bg-card border-border flex shrink-0 gap-4 overflow-auto border-b p-3 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-4"
    >
      {GROUPS.map((group) => (
        <div key={group} className="flex gap-1 md:flex-col">
          <h6 className="text-muted-foreground hidden px-2 pb-1 text-xs font-semibold tracking-wide md:block">
            {group}
          </h6>
          {NAV_AREAS.filter((area) => area.group === group).map((area) => {
            const Icon = ICONS[area.icon];
            return (
              <NavLink
                key={area.href}
                to={area.href}
                end={area.href === "/"}
                className={({ isActive }) =>
                  cn(
                    "text-foreground flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium whitespace-nowrap",
                    isActive && "bg-primary text-primary-foreground",
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {area.label}
                {area.restricted ? (
                  <Lock
                    aria-label="Separate sign-in"
                    className="text-muted-foreground ml-auto size-3"
                  />
                ) : null}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

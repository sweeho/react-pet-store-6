import {
  BarChart3,
  CheckSquare,
  CreditCard,
  Globe,
  Home,
  LayoutGrid,
  LogIn,
  type LucideIcon,
  Package,
  ShoppingCart,
  User,
} from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/utils";

import { type AreaIcon, areaGroups, areas } from "./areas";

const icons: Record<AreaIcon, LucideIcon> = {
  "layout-grid": LayoutGrid,
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  globe: Globe,
  "log-in": LogIn,
  user: User,
  "check-square": CheckSquare,
  "bar-chart": BarChart3,
  package: Package,
};

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium outline-none focus-visible:outline-2 focus-visible:outline-ring",
    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
  );

export default function GlobalNav() {
  return (
    <nav aria-label="Global" className="flex flex-col gap-4 p-3">
      <NavLink to="/" end className={itemClass}>
        <Home className="size-4" aria-hidden="true" />
        Home
      </NavLink>
      {areaGroups.map((group) => (
        <div key={group}>
          <h2 className="text-muted-foreground px-2 pb-1 text-xs font-semibold tracking-wide">
            {group}
          </h2>
          <ul className="flex flex-col">
            {areas
              .filter((area) => area.group === group)
              .map((area) => {
                const Icon = icons[area.icon];
                return (
                  <li key={area.label}>
                    <NavLink to={area.to} end className={itemClass}>
                      <Icon className="size-4" aria-hidden="true" />
                      {area.label}
                    </NavLink>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

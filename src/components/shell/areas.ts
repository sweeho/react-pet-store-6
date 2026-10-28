import { LayoutGrid, LogIn, Package, Settings, ShoppingCart, type LucideIcon } from "lucide-react";

export interface PrimaryArea {
  key: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "Shop" | "You" | "Store staff";
  staff?: boolean;
}

/** One entry per primary area route. A capability adding an area adds a row here. */
export const primaryAreas: PrimaryArea[] = [
  {
    key: "catalog-browsing",
    name: "Catalog & search",
    description: "Browse five categories or search by keyword.",
    href: "/petstore",
    icon: LayoutGrid,
    group: "Shop",
  },
  {
    key: "shopping-cart",
    name: "Shopping cart",
    description: "Add items without signing in, then check out.",
    href: "/petstore/cart",
    icon: ShoppingCart,
    group: "Shop",
  },
  {
    key: "sign-on",
    name: "Sign in",
    description:
      "Returning customers sign in; new customers sign up. Account and language live here.",
    href: "/petstore/signin",
    icon: LogIn,
    group: "You",
  },
  {
    key: "administration",
    name: "Administration",
    description: "Approve pending orders and review sales reports.",
    href: "/admin",
    icon: Settings,
    group: "Store staff",
    staff: true,
  },
  {
    key: "supplier-inventory",
    name: "Supplier inventory",
    description: "Update stock quantities for marked rows.",
    href: "/supplier",
    icon: Package,
    group: "Store staff",
    staff: true,
  },
];

export type NavGroup = "Shop" | "You" | "Store staff";

export type NavIcon =
  | "home"
  | "catalog"
  | "cart"
  | "checkout"
  | "signin"
  | "account"
  | "language"
  | "approval"
  | "reporting"
  | "inventory";

export interface NavArea {
  label: string;
  href: string;
  group: NavGroup;
  icon: NavIcon;
  /** Staff areas use a separate sign-in; the rail shows a lock. */
  restricted?: boolean;
}

export const NAV_AREAS: readonly NavArea[] = [
  { label: "Home", href: "/", group: "Shop", icon: "home" },
  { label: "Catalog", href: "/petstore", group: "Shop", icon: "catalog" },
  { label: "Shopping cart", href: "/petstore/cart", group: "Shop", icon: "cart" },
  { label: "Checkout", href: "/petstore/checkout", group: "Shop", icon: "checkout" },
  { label: "Sign in", href: "/petstore/signin", group: "You", icon: "signin" },
  { label: "Account & profile", href: "/petstore/account", group: "You", icon: "account" },
  { label: "Language", href: "/petstore/language", group: "You", icon: "language" },
  {
    label: "Order approval",
    href: "/admin/orders",
    group: "Store staff",
    icon: "approval",
    restricted: true,
  },
  {
    label: "Sales reporting",
    href: "/admin/sales",
    group: "Store staff",
    icon: "reporting",
    restricted: true,
  },
  {
    label: "Supplier inventory",
    href: "/supplier",
    group: "Store staff",
    icon: "inventory",
    restricted: true,
  },
];

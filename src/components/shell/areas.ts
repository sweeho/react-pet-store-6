export type AreaGroup = "Shop" | "Account" | "Administration" | "Supplier";

export type AreaIcon =
  | "layout-grid"
  | "shopping-cart"
  | "credit-card"
  | "globe"
  | "log-in"
  | "user"
  | "check-square"
  | "bar-chart"
  | "package";

export interface Area {
  label: string;
  to: string;
  group: AreaGroup;
  icon: AreaIcon;
}

export const areaGroups: AreaGroup[] = ["Shop", "Account", "Administration", "Supplier"];

export const areas: Area[] = [
  { label: "Catalog & search", to: "/petstore", group: "Shop", icon: "layout-grid" },
  { label: "Shopping cart", to: "/petstore/cart", group: "Shop", icon: "shopping-cart" },
  { label: "Checkout", to: "/petstore/cart", group: "Shop", icon: "credit-card" },
  { label: "Language", to: "/petstore", group: "Shop", icon: "globe" },
  { label: "Sign in", to: "/petstore/signin", group: "Account", icon: "log-in" },
  { label: "Account & profile", to: "/petstore/signin", group: "Account", icon: "user" },
  { label: "Order approval", to: "/admin", group: "Administration", icon: "check-square" },
  { label: "Sales reporting", to: "/admin", group: "Administration", icon: "bar-chart" },
  { label: "Supplier inventory", to: "/supplier", group: "Supplier", icon: "package" },
];

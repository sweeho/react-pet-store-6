export type NavGroup = "Shop" | "You" | "Store staff";

export interface NavArea {
  key: string;
  label: string;
  description: string;
  href: string;
  group: NavGroup;
  staff: boolean;
}

// One entry per primary area, keyed by capability slug. A capability that adds a primary
// area adds its entry here.
export const NAV_AREAS: readonly NavArea[] = [
  {
    key: "catalog-browsing",
    label: "Catalog & search",
    description: "Browse five categories or search by keyword.",
    href: "/petstore",
    group: "Shop",
    staff: false,
  },
  {
    key: "shopping-cart",
    label: "Shopping cart",
    description: "Add items without signing in. Kept for this visit only.",
    href: "/petstore/cart",
    group: "Shop",
    staff: false,
  },
  {
    key: "checkout",
    label: "Checkout",
    description: "Billing and shipping, pre-filled from your account.",
    href: "/petstore/checkout",
    group: "Shop",
    staff: false,
  },
  {
    key: "localization",
    label: "Language",
    description: "English, 日本語 or 中文 — prices follow the locale.",
    href: "/petstore/change-language",
    group: "You",
    staff: false,
  },
  {
    key: "sign-on",
    label: "Sign in",
    description: "Returning customers sign in; new customers sign up.",
    href: "/petstore/signin",
    group: "You",
    staff: false,
  },
  {
    key: "customer-account",
    label: "Account & profile",
    description: "Contact details, card and display preferences.",
    href: "/petstore/account",
    group: "You",
    staff: false,
  },
  {
    key: "order-approval",
    label: "Order approval",
    description: "Approve or deny pending orders in one batch.",
    href: "/admin",
    group: "Store staff",
    staff: true,
  },
  {
    key: "sales-reporting",
    label: "Sales reporting",
    description: "Order lists and revenue charts by date range.",
    href: "/admin/tool",
    group: "Store staff",
    staff: true,
  },
  {
    key: "supplier-inventory",
    label: "Supplier inventory",
    description: "Update stock quantities for marked rows.",
    href: "/supplier",
    group: "Store staff",
    staff: true,
  },
];

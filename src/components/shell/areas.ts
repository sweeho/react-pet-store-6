import {
  BarChart3,
  ClipboardCheck,
  CreditCard,
  Globe,
  LayoutGrid,
  LogIn,
  Package,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";

export interface PrimaryArea {
  key: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "Shop" | "You" | "Store staff";
  staff?: boolean;
}

/** One entry per primary area. A capability adding an area adds a row here. */
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
    description: "Add items without signing in. Kept for this visit only.",
    href: "/petstore/cart",
    icon: ShoppingCart,
    group: "Shop",
  },
  {
    key: "checkout",
    name: "Checkout",
    description: "Billing and shipping, pre-filled from your account.",
    href: "/petstore/checkout",
    icon: CreditCard,
    group: "Shop",
  },
  {
    key: "sign-on",
    name: "Sign in",
    description: "Returning customers sign in; new customers sign up.",
    href: "/petstore/signon",
    icon: LogIn,
    group: "You",
  },
  {
    key: "customer-account",
    name: "Account & profile",
    description: "Contact details, card and display preferences.",
    href: "/petstore/account",
    icon: User,
    group: "You",
  },
  {
    key: "localization",
    name: "Language",
    description: "English, 日本語 or 中文 — prices follow the locale.",
    href: "/petstore/language",
    icon: Globe,
    group: "You",
  },
  {
    key: "order-approval",
    name: "Order approval",
    description: "Approve or deny pending orders in one batch.",
    href: "/admin/orders",
    icon: ClipboardCheck,
    group: "Store staff",
    staff: true,
  },
  {
    key: "sales-reporting",
    name: "Sales reporting",
    description: "Order lists and revenue charts by date range.",
    href: "/admin/sales",
    icon: BarChart3,
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

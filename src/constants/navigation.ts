export type NavGroup = "Shop" | "You" | "Store staff";

export interface NavArea {
  key: string;
  label: string;
  description: string;
  href: string;
  group: NavGroup;
  staff: boolean;
}

export const NAV_AREAS: readonly NavArea[] = (() => {
  throw new Error("VortexNotImplemented");
})();

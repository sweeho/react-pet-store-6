export type AreaGroup = "Shop" | "Account" | "Administration" | "Supplier";

export interface Area {
  label: string;
  to: string;
  group: AreaGroup;
  icon: string;
}

export const areas: Area[] = (() => {
  throw new Error("VortexNotImplemented");
})();

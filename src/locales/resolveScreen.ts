export interface ResolveScreenArgs {
  screen: string;
  requestLocale?: string;
  sessionLocale: string;
}

export function resolveScreen(args: ResolveScreenArgs): { locale: string; definition: unknown } {
  void args;
  throw new Error("VortexNotImplemented");
}

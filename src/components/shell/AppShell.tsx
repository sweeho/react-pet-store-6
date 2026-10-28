import type { ReactNode } from "react";

export interface AppShellProps {
  children?: ReactNode;
  header?: ReactNode;
}

export default function AppShell(props: AppShellProps): never {
  void props;
  throw new Error("VortexNotImplemented");
}

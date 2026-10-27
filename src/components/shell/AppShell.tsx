import type { ReactNode } from "react";

export interface AppShellProps {
  children: ReactNode;
  headerSlot?: ReactNode;
}

export default function AppShell({ children, headerSlot }: AppShellProps): ReactNode {
  void children;
  void headerSlot;
  throw new Error("VortexNotImplemented");
}

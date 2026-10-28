import type { ReactNode } from "react";

export interface EmptyFrameProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyFrame(): ReactNode {
  throw new Error("VortexNotImplemented");
}

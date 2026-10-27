import type { ReactNode } from "react";

export interface ErrorFrameProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export default function ErrorFrame(): ReactNode {
  throw new Error("VortexNotImplemented");
}

import { LoaderCircle } from "lucide-react";

export interface LoadingFrameProps {
  label?: string;
}

export default function LoadingFrame({ label = "Loading…" }: LoadingFrameProps) {
  return (
    <div
      data-testid="loading-frame"
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm"
    >
      <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

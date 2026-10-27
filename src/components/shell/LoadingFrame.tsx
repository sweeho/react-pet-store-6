export interface LoadingFrameProps {
  label?: string;
}

export default function LoadingFrame({ label = "Loading…" }: LoadingFrameProps) {
  return (
    <div
      role="status"
      data-testid="loading-frame"
      className="text-muted-foreground mx-auto my-12 flex items-center justify-center gap-2 text-sm"
    >
      <span
        aria-hidden="true"
        className="border-border border-t-primary size-4 animate-spin rounded-full border-2"
      />
      {label}
    </div>
  );
}

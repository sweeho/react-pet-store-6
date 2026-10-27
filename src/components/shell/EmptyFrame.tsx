import type { ReactNode } from "react";

export interface EmptyFrameProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyFrame({ title, message, action }: EmptyFrameProps) {
  return (
    <div
      data-testid="empty-frame"
      className="border-border bg-card text-card-foreground mx-auto my-12 flex max-w-md flex-col items-center gap-2 rounded-lg border p-8 text-center"
    >
      {title ? <h1 className="text-2xl font-semibold">{title}</h1> : null}
      <p className="text-muted-foreground text-sm">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

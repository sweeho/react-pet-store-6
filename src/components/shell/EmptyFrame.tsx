import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyFrameProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyFrame({
  title = "Nothing here yet",
  message,
  action,
}: EmptyFrameProps) {
  return (
    <div
      data-testid="empty-frame"
      className="bg-muted flex min-h-[320px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center"
    >
      <div className="bg-background text-muted-foreground mb-4 grid size-12 place-items-center rounded-full border">
        <Inbox className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mb-1 text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-md text-sm">{message}</p>
      {action ? <div className="flex gap-2">{action}</div> : null}
    </div>
  );
}

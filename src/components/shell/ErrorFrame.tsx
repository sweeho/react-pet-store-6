import { Home, RefreshCw, TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui";

export interface ErrorFrameProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export default function ErrorFrame({
  title = "We couldn’t load this page",
  message = "The store didn’t respond. Try again, or go back to the home page.",
  onRetry,
}: ErrorFrameProps) {
  return (
    <div
      data-testid="error-frame"
      role="alert"
      className="bg-muted flex min-h-[320px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center"
    >
      <div className="bg-background mb-4 grid size-12 place-items-center rounded-full border text-red-600">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mb-1 text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-md text-sm">{message}</p>
      <div className="flex gap-2">
        <Button onClick={onRetry} aria-label="Retry: try again">
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link to="/">
            <Home aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}

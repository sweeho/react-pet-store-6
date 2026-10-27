import { Button } from "../ui";

export interface ErrorFrameProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export default function ErrorFrame({
  title = "Something went wrong",
  message = "We could not load this page. Please try again.",
  onRetry,
}: ErrorFrameProps) {
  return (
    <div
      data-testid="error-frame"
      role="alert"
      className="border-destructive bg-card text-card-foreground mx-auto my-12 flex max-w-md flex-col items-center gap-2 rounded-lg border p-8 text-center"
    >
      <h2 className="text-destructive text-2xl font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

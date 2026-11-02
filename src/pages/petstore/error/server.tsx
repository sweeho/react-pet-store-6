import { Home, ShoppingCart, CircleAlert } from "lucide-react";
import { Link, useLocation } from "react-router";

import { buttonVariants } from "@/components/ui/button-variants";

interface Failure {
  message?: string;
  trace?: string;
}

export default function ServerErrorPage() {
  const failure = (useLocation().state ?? {}) as Failure;
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Server Error</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Something went wrong on our side while handling your request.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
            <Home className="mr-2 size-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link to="/petstore/cart" className={buttonVariants()}>
            <ShoppingCart className="mr-2 size-4" aria-hidden="true" />
            Back to cart
          </Link>
        </div>
      </div>
      <div className="bg-background flex gap-3 rounded-lg border border-red-200 p-4">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium">Your order could not be placed</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Please notify the administrator and include the error message and trace below.
          </p>
          {failure.message ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-sm break-words text-red-800">
              {failure.message}
            </div>
          ) : null}
        </div>
      </div>
      {failure.trace ? (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground flex justify-between px-4 py-2 text-xs font-semibold">
            <span>TECHNICAL ERROR TRACE</span>
            <span className="font-normal">For the administrator</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {failure.trace}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

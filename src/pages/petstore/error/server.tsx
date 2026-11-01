import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button-variants";

export default function ServerErrorPage() {
  return (
    <div className="flex justify-center pt-16">
      <div className="bg-background w-full max-w-md rounded-lg border p-8 text-center">
        <h1 className="text-2xl font-semibold">Server error</h1>
        <p className="text-muted-foreground mt-2 mb-6 text-sm">
          Something went wrong on our side. Please try again.
        </p>
        <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

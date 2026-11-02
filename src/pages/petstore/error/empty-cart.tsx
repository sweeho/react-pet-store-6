import { LayoutGrid, ShoppingCart } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button-variants";

export default function EmptyCartErrorPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Billing and shipping information</h1>
        <p className="text-muted-foreground mt-1 text-sm">Your order couldn&apos;t be placed.</p>
      </div>
      <div className="bg-muted flex flex-col items-center rounded-lg border px-6 py-12 text-center">
        <div className="bg-background text-muted-foreground mb-4 grid size-12 place-items-center rounded-full border">
          <ShoppingCart className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mb-1 text-lg font-semibold">
          Your cart is empty, so there&apos;s no order to place
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md text-sm">
          Nothing was ordered. Add an item from the catalog, then check out again.
        </p>
        <div className="flex gap-2">
          <Link to="/petstore" className={buttonVariants()}>
            <LayoutGrid className="mr-2 size-4" aria-hidden="true" />
            Browse the catalog
          </Link>
          <Link to="/petstore/cart" className={buttonVariants({ variant: "secondary" })}>
            View cart
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";

export default function EmptyCartOrderError() {
  return (
    <EmptyFrame
      title="Your order cannot be placed: the cart is empty"
      message="Add at least one item to your cart before checking out."
      action={
        <Link to="/petstore/cart" className="text-primary text-sm font-medium hover:underline">
          Back to the shopping cart
        </Link>
      }
    />
  );
}

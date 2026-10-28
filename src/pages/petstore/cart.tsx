import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";

export default function PetstoreCart() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Shopping cart</h1>
      <EmptyFrame
        message="Your cart will appear here once the cart ships."
        action={
          <Link to="/" className="text-primary text-sm font-medium hover:underline">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

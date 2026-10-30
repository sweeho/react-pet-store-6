import { Link } from "react-router";

export default function EmptyCartOrderError() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Your cart is empty</h1>
      <p className="mb-4 text-sm">An order cannot be placed with an empty shopping cart.</p>
      <Link to="/" className="text-primary text-sm font-medium hover:underline">
        Back to home
      </Link>
    </div>
  );
}

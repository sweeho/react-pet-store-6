import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";

export default function SupplierHome() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Supplier inventory</h1>
      <EmptyFrame
        message="Supplier inventory will appear here once it ships."
        action={
          <Link to="/" className="text-primary text-sm font-medium hover:underline">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

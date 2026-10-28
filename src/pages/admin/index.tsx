import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";

export default function AdminHome() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Administration</h1>
      <EmptyFrame
        message="Order approval and sales reporting will appear here once they ship."
        action={
          <Link to="/" className="text-primary text-sm font-medium hover:underline">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

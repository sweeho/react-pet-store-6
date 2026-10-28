import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";

export default function PetstoreSignin() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
      <EmptyFrame
        message="Sign-in will appear here once it ships."
        action={
          <Link to="/" className="text-primary text-sm font-medium hover:underline">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

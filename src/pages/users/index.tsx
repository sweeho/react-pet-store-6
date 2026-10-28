import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import ErrorFrame from "@/components/shell/ErrorFrame";
import LoadingFrame from "@/components/shell/LoadingFrame";
import { useApi } from "@/hooks";

interface User {
  id: number;
  name: string;
}

// The API returns { users: [...] }; a bare array is accepted too (design.md D1).
type UsersBody = User[] | { users: User[] };

export default function Users() {
  const { data, error, loading, retry } = useApi<UsersBody>("/api/users");

  if (loading) return <LoadingFrame label="Loading users…" />;
  if (error) return <ErrorFrame onRetry={retry} title="We couldn’t load the users" />;

  const users = Array.isArray(data) ? data : (data?.users ?? []);
  if (users.length === 0)
    return <EmptyFrame title="No users yet" message="There are no users to show." />;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-4xl font-bold">Users List</h1>
      <ul className="mb-8 space-y-4">
        {users.map((user) => (
          <li key={user.id} className="rounded border p-4 hover:bg-gray-50">
            <Link to={`/users/${user.id}`} className="text-primary font-medium hover:underline">
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/users/profile" className="text-primary hover:underline">
        View Profile
      </Link>
    </div>
  );
}

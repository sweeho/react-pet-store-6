import { BarChart3, CheckSquare, LogIn, LogOut, TriangleAlert, Wrench } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";

const field =
  "bg-background focus-visible:outline-ring mt-1 mb-4 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:outline-2";

const FACILITIES = [
  {
    icon: CheckSquare,
    title: "Approve or deny pending orders",
    text: "Mark each pending order approved or denied, then commit them together.",
  },
  {
    icon: Wrench,
    title: "Orders by status",
    text: "See approved, denied and completed orders, sorted by any column.",
  },
  {
    icon: BarChart3,
    title: "Sales and revenue",
    text: "Revenue and order counts per category over a date range.",
  },
];

type State =
  | { kind: "loading" }
  | { kind: "out" }
  | { kind: "rejected" }
  | { kind: "in"; userId: string };

export default function AdminHome() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/admin/session")
      .then(async (r) => {
        if (!live) return;
        setState(
          r.ok
            ? { kind: "in", userId: ((await r.json()) as { userId: string }).userId }
            : { kind: "out" },
        );
      })
      .catch(() => live && setState({ kind: "out" }));
    return () => {
      live = false;
    };
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    }).catch(() => null);
    setPassword("");
    setState(res?.ok ? { kind: "in", userId } : { kind: "rejected" });
  };

  const logOut = async () => {
    await fetch("/api/admin/sign-out", { method: "POST" });
    setUserId("");
    setState({ kind: "out" });
  };

  if (state.kind === "loading") return null;

  if (state.kind === "in")
    return (
      <div>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Administration</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Signed in as <span className="font-mono">{state.userId}</span>. View sales, revenue
              and order status, and approve or deny orders.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/tool" className={buttonVariants({ variant: "secondary" })}>
              Launch administration tool
            </Link>
            <Button type="button" variant="outline" onClick={() => void logOut()}>
              <LogOut aria-hidden="true" className="mr-2 size-4" />
              Log out
            </Button>
          </div>
        </div>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
          What you can do here
        </h2>
        <div className="grid max-w-5xl gap-4 md:grid-cols-3">
          {FACILITIES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-background flex gap-3 rounded-lg border p-4">
              <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 max-w-5xl rounded-lg border p-3 text-sm">
          Your administration session ends after 54 minutes without activity. To use the supplier
          area, log out of Administration first.
        </p>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Administration sign-in</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        For store administrators. This is a separate sign-in from your customer account.
      </p>
      {state.kind === "rejected" ? (
        <div className="border-destructive max-w-md rounded-lg border p-6">
          <div className="flex items-start gap-3">
            <TriangleAlert className="text-destructive mt-0.5 size-5" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold">Login Error</h2>
              <p className="text-muted-foreground mt-1.5 mb-5 text-sm">
                You could not be authenticated with the information provided. Please check your
                Username and Password.
              </p>
              <Link
                to="/admin"
                onClick={() => setState({ kind: "out" })}
                className={buttonVariants({ variant: "secondary" })}
              >
                Back to sign-in
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => void signIn(e)}
          className="bg-background max-w-md rounded-lg border p-6"
        >
          <h2 className="text-base font-semibold">Sign in to Administration</h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">
            Approve or deny orders and review sales.
          </p>
          <label htmlFor="admin-user" className="text-sm font-medium">
            User ID
          </label>
          <input
            id="admin-user"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={field}
          />
          <label htmlFor="admin-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          <Button type="submit" className="w-full">
            <LogIn aria-hidden="true" className="mr-2 size-4" />
            Sign in
          </Button>
          <p className="text-muted-foreground mt-4 text-xs">
            Signed out automatically after 54 minutes without activity.
          </p>
        </form>
      )}
    </div>
  );
}

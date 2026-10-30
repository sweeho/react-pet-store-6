import { LogIn, LogOut } from "lucide-react";

import { Button } from "@/components/ui";

const field =
  "bg-background focus-visible:outline-ring mt-1 mb-4 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:outline-2";

type State =
  | { kind: "loading" }
  | { kind: "out" }
  | { kind: "rejected" }
  | { kind: "adminSignedIn" }
  | { kind: "in"; userId: string };

export default function SupplierHome() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/supplier/session")
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
    const res = await fetch("/api/supplier/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    }).catch(() => null);
    setPassword("");
    if (res?.ok) setState({ kind: "in", userId });
    else setState({ kind: res?.status === 409 ? "adminSignedIn" : "rejected" });
  };

  const logOut = async () => {
    await fetch("/api/supplier/sign-out", { method: "POST" });
    setUserId("");
    setState({ kind: "out" });
  };

  if (state.kind === "loading") return null;

  if (state.kind === "in")
    return (
      <div>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Supplier inventory</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Signed in as <span className="font-mono">{state.userId}</span>.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void logOut()}>
            <LogOut aria-hidden="true" className="mr-2 size-4" />
            Log out
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Supplier inventory will appear here once it ships.
        </p>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-semibold">Supplier sign-in</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        For the store&apos;s supplier. Sign in to view and update inventory.
      </p>
      <div className="grid max-w-4xl items-start gap-6 md:grid-cols-2">
        <form onSubmit={(e) => void signIn(e)} className="bg-background rounded-lg border p-6">
          <h2 className="text-base font-semibold">Sign in to the supplier area</h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">
            Use the supplier user id and password.
          </p>
          <label htmlFor="supplier-user" className="text-sm font-medium">
            User ID
          </label>
          <input
            id="supplier-user"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={field}
          />
          <label htmlFor="supplier-password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="supplier-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          {state.kind === "rejected" && (
            <p role="alert" className="text-destructive mb-4 text-xs">
              Login error: that user id and password were not recognised. Check them and try again.
            </p>
          )}
          {state.kind === "adminSignedIn" && (
            <p role="alert" className="text-destructive mb-4 text-xs">
              Sign out of Administration first, then sign in to the supplier area.
            </p>
          )}
          <Button type="submit" className="w-full">
            <LogIn aria-hidden="true" className="mr-2 size-4" />
            Sign in
          </Button>
        </form>
        <p className="text-muted-foreground rounded-lg border p-4 text-sm">
          <b className="text-foreground font-semibold">Signed in to Administration?</b>
          <br />
          Log out of Administration before you use the supplier area &mdash; the two are separate.
        </p>
      </div>
    </div>
  );
}

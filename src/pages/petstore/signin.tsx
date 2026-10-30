import { LogIn, UserPlus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";

const field =
  "bg-background focus-visible:outline-ring mt-1 mb-4 h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:outline-2";

/** Only same-site paths are honoured as a return target. */
function safeReturn(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/petstore";
}

export default function PetstoreSignin() {
  const { locale } = useLocale();
  const screen = useScreen("signon", locale);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [failed, setFailed] = useState(false);

  // Pre-fill only the remembered user name, never credentials.
  useEffect(() => {
    let live = true;
    fetch("/api/session")
      .then((r) => r.json() as Promise<{ rememberedUserName?: string }>)
      .then((s) => {
        if (!live || !s.rememberedUserName) return;
        setUserId(s.rememberedUserName);
        setRemember(true);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if ("error" in screen) return screen.error;
  const t = screen.definition;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailed(false);
    const res = await fetch("/api/session/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password, remember }),
    }).catch(() => null);
    if (res?.ok) void navigate(safeReturn(params.get("return")));
    else setFailed(true);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t.intro}</p>
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <form onSubmit={(e) => void submit(e)} className="bg-background rounded-lg border p-6">
          <h2 className="text-base font-semibold">{t.returningTitle}</h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">{t.returningHelp}</p>
          <label htmlFor="signin-user" className="text-sm font-medium">
            {t.userId}
          </label>
          <input
            id="signin-user"
            name="userId"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={field}
          />
          <label htmlFor="signin-password" className="text-sm font-medium">
            {t.password}
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {t.remember}
          </label>
          <p className="text-muted-foreground mt-1 mb-5 ml-6 text-xs">{t.rememberHint}</p>
          {failed && (
            <p role="alert" className="text-destructive mb-4 text-sm">
              {t.failed}
            </p>
          )}
          <Button type="submit" className="w-full">
            <LogIn aria-hidden="true" className="mr-2 size-4" />
            {t.signIn}
          </Button>
        </form>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-background rounded-lg border p-6"
          aria-label={t.newTitle}
        >
          <h2 className="text-base font-semibold">{t.newTitle}</h2>
          <p className="text-muted-foreground mt-1 mb-5 text-sm">{t.newHelp}</p>
          <label htmlFor="new-user" className="text-sm font-medium">
            {t.newUserName}
          </label>
          <input id="new-user" name="newUser" className={field} placeholder="ann" />
          <label htmlFor="new-secret" className="text-sm font-medium">
            {t.newSecret}
          </label>
          <input id="new-secret" name="newSecret" type="password" className={field} />
          <label htmlFor="new-secret2" className="text-sm font-medium">
            {t.newSecretAgain}
          </label>
          <input id="new-secret2" name="newSecret2" type="password" className={field} />
          <Button type="submit" variant="secondary" className="w-full">
            <UserPlus aria-hidden="true" className="mr-2 size-4" />
            {t.create}
          </Button>
        </form>
      </div>
      <p className="text-muted-foreground mt-6 max-w-4xl rounded-lg border p-3 text-sm">
        {t.idleNote}
      </p>
    </div>
  );
}

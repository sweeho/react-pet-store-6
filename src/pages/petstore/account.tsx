import { useNavigate } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { useScreen } from "@/locales/useScreen";

export default function Account() {
  const { locale } = useLocale();
  const screen = useScreen("signon", locale);
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/account")
      .then(async (r) => {
        if (!live) return;
        if (r.status === 401)
          void navigate(`/petstore/signin?return=${encodeURIComponent("/petstore/account")}`, {
            replace: true,
          });
        else if (r.ok) setUserId(((await r.json()) as { userId: string }).userId);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [navigate]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  if (userId === null) return null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{t.accountTitle}</h1>
      <p className="text-sm">
        {t.signedInAs} <span className="font-mono font-medium">{userId}</span>
      </p>
    </div>
  );
}

import { LogIn, LogOut, PawPrint, ShoppingCart, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

import { DEFAULT_LOCALE } from "../../../shared/i18n/locale";
import SearchBox from "./SearchBox";

interface SessionState {
  locale: string;
  signedOn: boolean;
}

const ghost = buttonVariants({ variant: "ghost", size: "sm" });

/** The storefront page header: main-page link, search, Account, Cart and Sign in or Sign out. */
export default function StorefrontHeader() {
  const [session, setSession] = useState<SessionState | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const screen = useScreen("signon", session?.locale ?? DEFAULT_LOCALE);

  // Sign-on state changes with navigation (sign in, sign out, idle expiry), so ask again per page.
  useEffect(() => {
    let live = true;
    fetch("/api/session")
      .then((r) => r.json() as Promise<SessionState>)
      .then((s) => live && setSession(s))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [pathname]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;

  const signOut = async () => {
    await fetch("/api/session/sign-out", { method: "POST" });
    setSession(null);
    void navigate("/petstore/signed-out");
  };

  return (
    <>
      <Link
        to="/"
        className="focus-visible:outline-ring flex items-center gap-2 text-base font-semibold outline-none focus-visible:outline-2 lg:w-52"
      >
        <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg">
          <PawPrint className="size-4" aria-hidden="true" />
        </span>
        {t.mainPage}
      </Link>
      <SearchBox />
      <div className="ml-auto flex items-center gap-1">
        <Link to="/petstore/cart" className={ghost}>
          <ShoppingCart className="mr-1.5 size-4" aria-hidden="true" />
          {t.cart}
        </Link>
        <Link to="/petstore/account" className={ghost}>
          <User className="mr-1.5 size-4" aria-hidden="true" />
          {t.account}
        </Link>
        {session === null ? null : session.signedOn ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <LogOut className="mr-1.5 size-4" aria-hidden="true" />
            {t.signOut}
          </button>
        ) : (
          <Link
            to="/petstore/signin"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <LogIn className="mr-1.5 size-4" aria-hidden="true" />
            {t.signIn}
          </Link>
        )}
      </div>
    </>
  );
}

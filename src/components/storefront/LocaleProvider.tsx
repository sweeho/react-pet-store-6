import type { ReactNode } from "react";
import { createContext } from "react";

import { DEFAULT_LOCALE } from "../../../shared/i18n/locale";

interface LocaleState {
  locale: string;
  setLocale: (locale: string) => Promise<string>;
}

const LocaleContext = createContext<LocaleState>({
  locale: DEFAULT_LOCALE,
  setLocale: async () => DEFAULT_LOCALE,
});

/** Holds the server session locale for the storefront and changes it through the session API. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);

  useEffect(() => {
    let live = true;
    fetch("/api/session")
      .then((r) => r.json() as Promise<{ locale: string }>)
      .then((s) => live && setLocaleState(s.locale))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const setLocale = async (next: string) => {
    const res = await fetch("/api/session/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    if (!res.ok) throw new Error(`Unable to change language to ${next}`);
    const { locale: saved } = (await res.json()) as { locale: string };
    setLocaleState(saved);
    return saved;
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocale(): LocaleState {
  return useContext(LocaleContext);
}

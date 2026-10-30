import { Lightbulb } from "lucide-react";
import { Link } from "react-router";

import { useScreen } from "@/locales/useScreen";

import { BANNER_CATEGORIES } from "../../../shared/account";
import { useLocale } from "./LocaleProvider";

interface Preferences {
  banner?: boolean;
  favouriteCategory?: string | null;
}

const TIP_KEYS = {
  dogs: ["tipDogsTitle", "tipDogsText"],
  cats: ["tipCatsTitle", "tipCatsText"],
  reptiles: ["tipReptilesTitle", "tipReptilesText"],
  birds: ["tipBirdsTitle", "tipBirdsText"],
  fish: ["tipFishTitle", "tipFishText"],
} as const;

/** The banner category for a favourite: dogs, cats, reptiles, birds or fish; dogs for anything else. */
function bannerCategory(favourite: string | null | undefined): (typeof BANNER_CATEGORIES)[number] {
  const lower = favourite?.toLowerCase();
  return BANNER_CATEGORIES.find((c) => c === lower) ?? "dogs";
}

/** Pet tips for the favourite category; shown on the home and cart screens only (SWHR2-R-0054). */
export default function PetTipsBanner({ screen }: { screen: string }) {
  const { locale } = useLocale();
  const text = useScreen("account", locale);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const eligible = screen === "home" || screen === "cart";

  useEffect(() => {
    if (!eligible) return;
    let live = true;
    fetch("/api/session")
      .then((r) => r.json() as Promise<{ preferences?: Preferences }>)
      .then((s) => live && setPrefs(s.preferences ?? null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [eligible]);

  if (!eligible || !prefs?.banner || "error" in text) return null;
  const t = text.definition;
  const category = bannerCategory(prefs.favouriteCategory);
  const [titleKey, textKey] = TIP_KEYS[category];

  return (
    <section
      data-testid="pet-tips-banner"
      data-category={category}
      aria-label={t.tipLabel}
      className="bg-muted/40 mb-6 flex items-center gap-4 rounded-lg border p-4"
    >
      <span className="bg-primary text-primary-foreground grid size-12 shrink-0 place-items-center rounded-lg">
        <Lightbulb className="size-6" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-primary text-xs font-semibold tracking-wide">
          {t.tipTag} · {t[`cat${category.toUpperCase()}`]?.toUpperCase()}
        </p>
        <p className="text-base font-semibold">{t[titleKey]}</p>
        <p className="text-muted-foreground mt-0.5 text-sm">{t[textKey]}</p>
      </div>
      <Link
        to={`/petstore/category/${category.toUpperCase()}`}
        className="focus-visible:outline-ring hover:bg-accent inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium outline-none focus-visible:outline-2"
      >
        {t.tipShop} {t[`cat${category.toUpperCase()}`]}
      </Link>
    </section>
  );
}

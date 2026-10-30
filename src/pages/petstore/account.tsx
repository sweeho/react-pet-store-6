import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { Button } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

import { CARD_TYPES, EXPIRY_MONTHS, EXPIRY_YEARS } from "../../../shared/account";

const LANGUAGES: [string, string][] = [
  ["en_US", "English (US)"],
  ["ja_JP", "日本語"],
  ["zh_CN", "中文"],
];
const CATEGORIES = ["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"] as const;

interface CustomerView {
  contact: {
    givenName: string;
    familyName: string;
    telephone: string;
    email: string;
    address: {
      street1: string;
      street2: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  card: { cardType: string; expiryMonth: number; expiryYear: number; last4: string };
  profile: {
    preferredLanguage: string;
    favouriteCategory: string | null;
    myListOn: boolean;
    bannerOn: boolean;
  };
}

interface FormState {
  givenName: string;
  familyName: string;
  email: string;
  telephone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  cardType: string;
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  preferredLanguage: string;
  favouriteCategory: string;
  myListOn: boolean;
  bannerOn: boolean;
}

const EMPTY: FormState = {
  givenName: "",
  familyName: "",
  email: "",
  telephone: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  cardType: CARD_TYPES[0],
  cardNumber: "",
  expiryMonth: EXPIRY_MONTHS[0],
  expiryYear: EXPIRY_YEARS[0],
  preferredLanguage: "en_US",
  favouriteCategory: "",
  myListOn: true,
  bannerOn: true,
};

function fromCustomer(c: CustomerView): FormState {
  return {
    ...c.contact,
    ...c.contact.address,
    cardType: c.card.cardType,
    cardNumber: "",
    expiryMonth: c.card.expiryMonth,
    expiryYear: c.card.expiryYear,
    preferredLanguage: c.profile.preferredLanguage,
    favouriteCategory: c.profile.favouriteCategory ?? "",
    myListOn: c.profile.myListOn,
    bannerOn: c.profile.bannerOn,
  };
}

const control =
  "bg-background focus-visible:outline-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:outline-2";

export default function Account() {
  const { locale } = useLocale();
  const screen = useScreen("account", locale);
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/account")
      .then(async (r) => {
        if (!live) return;
        if (r.status === 401) {
          void navigate(`/petstore/signin?return=${encodeURIComponent("/petstore/account")}`, {
            replace: true,
          });
          return;
        }
        if (!r.ok) return;
        const body = (await r.json()) as { userId: string; customer?: CustomerView };
        if (!live) return;
        if (body.customer) {
          setExisting(true);
          setForm(fromCustomer(body.customer));
        }
        setUserId(body.userId);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [navigate]);

  if ("error" in screen) return screen.error;
  const t = screen.definition;
  if (userId === null) return null;

  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const text = (
    key: keyof FormState & string,
    label: string,
    extra: { required?: boolean } = {},
  ) => (
    <div>
      <label htmlFor={`acct-${key}`} className="mb-1 block text-xs font-medium">
        {label}
      </label>
      <input
        id={`acct-${key}`}
        value={String(form[key])}
        onChange={(e) => set(key)(e.target.value as never)}
        required={extra.required ?? true}
        className={control}
      />
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailed(false);
    const contact = {
      givenName: form.givenName,
      familyName: form.familyName,
      email: form.email,
      telephone: form.telephone,
      address: {
        street1: form.street1,
        street2: form.street2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
      },
    };
    const card = {
      cardType: form.cardType,
      expiryMonth: form.expiryMonth,
      expiryYear: form.expiryYear,
      // A blank number keeps the card on file when editing.
      ...(form.cardNumber !== "" && { cardNumber: form.cardNumber }),
    };
    const profile = {
      preferredLanguage: form.preferredLanguage,
      favouriteCategory: form.favouriteCategory === "" ? null : form.favouriteCategory,
      myListOn: form.myListOn,
      bannerOn: form.bannerOn,
    };
    const res = await fetch("/api/account", {
      method: existing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, card, profile }),
    }).catch(() => null);
    if (res?.ok) void navigate("/petstore");
    else setFailed(true);
  };

  const toggle = (key: "myListOn" | "bannerOn", label: string, help: string) => (
    <div className="flex items-center justify-between gap-4 border-t py-3">
      <div>
        <label htmlFor={`acct-${key}`} className="block text-sm font-medium">
          {label}
        </label>
        <span className="text-muted-foreground text-xs">{help}</span>
      </div>
      <input
        id={`acct-${key}`}
        type="checkbox"
        role="switch"
        checked={form[key]}
        onChange={(e) => set(key)(e.target.checked)}
        className="size-5"
      />
    </div>
  );

  const card = "bg-background rounded-lg border p-4";
  return (
    <form onSubmit={(e) => void submit(e)} aria-label={t.title}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.signedInAs} <span className="font-mono font-medium">{userId}</span>. {t.intro}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
            {t.cancel}
          </Link>
          <Button type="submit">
            <Check aria-hidden="true" className="mr-2 size-4" />
            {existing ? t.save : t.create}
          </Button>
        </div>
      </div>
      {failed && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {t.saveFailed}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={card}>
          <h2 className="text-base font-semibold">{t.contactTitle}</h2>
          <p className="text-muted-foreground mt-0.5 mb-4 text-xs">{t.contactHelp}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {text("givenName", t.givenName)}
            {text("familyName", t.familyName)}
            {text("email", t.email)}
            {text("telephone", t.telephone)}
            <div className="col-span-2">{text("street1", t.street1)}</div>
            <div className="col-span-2">{text("street2", t.street2, { required: false })}</div>
            {text("city", t.city)}
            {text("state", t.state)}
            {text("zip", t.zip)}
            {text("country", t.country)}
          </div>
        </section>
        <div className="flex flex-col gap-6">
          <section className={card}>
            <h2 className="text-base font-semibold">{t.cardTitle}</h2>
            <p className="text-muted-foreground mt-0.5 mb-4 text-xs">{t.cardHelp}</p>
            <label htmlFor="acct-cardType" className="mb-1 block text-xs font-medium">
              {t.cardType}
            </label>
            <select
              id="acct-cardType"
              value={form.cardType}
              onChange={(e) => set("cardType")(e.target.value)}
              className={`${control} mb-3`}
            >
              {CARD_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-x-4">
              <div>
                <label htmlFor="acct-cardNumber" className="mb-1 block text-xs font-medium">
                  {t.cardNumber}
                </label>
                <input
                  id="acct-cardNumber"
                  value={form.cardNumber}
                  onChange={(e) => set("cardNumber")(e.target.value)}
                  required={!existing}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={existing ? t.cardNumberKeep : ""}
                  className={`${control} font-mono`}
                />
              </div>
              <div>
                <label htmlFor="acct-month" className="mb-1 block text-xs font-medium">
                  {t.month}
                </label>
                <select
                  id="acct-month"
                  value={form.expiryMonth}
                  onChange={(e) => set("expiryMonth")(Number(e.target.value))}
                  className={control}
                >
                  {EXPIRY_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="acct-year" className="mb-1 block text-xs font-medium">
                  {t.year}
                </label>
                <select
                  id="acct-year"
                  value={form.expiryYear}
                  onChange={(e) => set("expiryYear")(Number(e.target.value))}
                  className={control}
                >
                  {EXPIRY_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{t.yearHint}</p>
          </section>
          <section className={card}>
            <h2 className="text-base font-semibold">{t.prefTitle}</h2>
            <p className="text-muted-foreground mt-0.5 mb-4 text-xs">{t.prefHelp}</p>
            <div className="mb-3 grid grid-cols-2 gap-x-4">
              <div>
                <label htmlFor="acct-language" className="mb-1 block text-xs font-medium">
                  {t.language}
                </label>
                <select
                  id="acct-language"
                  value={form.preferredLanguage}
                  onChange={(e) => set("preferredLanguage")(e.target.value)}
                  className={control}
                >
                  {LANGUAGES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="acct-favourite" className="mb-1 block text-xs font-medium">
                  {t.favourite}
                </label>
                <select
                  id="acct-favourite"
                  value={form.favouriteCategory}
                  onChange={(e) => set("favouriteCategory")(e.target.value)}
                  className={control}
                >
                  <option value="">{t.noFavourite}</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t[`cat${c}`]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {toggle("myListOn", t.myList, t.myListHelp)}
            {toggle("bannerOn", t.banner, t.bannerHelp)}
          </section>
        </div>
      </div>
    </form>
  );
}

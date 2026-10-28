import { Globe } from "lucide-react";

import { Button } from "@/components/ui";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { useScreen } from "@/locales/useScreen";

const OPTIONS = [
  { value: "en_US", label: "US English" },
  { value: "de_DE", label: "German" },
  { value: "ja_JP", label: "Japanese" },
  { value: "zh_CN", label: "Simplified Chinese" },
];

export default function ChangeLanguage() {
  const { locale, setLocale } = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const [changed, setChanged] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const screen = useScreen("change-language", locale);
  const success = useScreen("change-language-success", locale);
  if ("error" in screen) return screen.error;
  if ("error" in success) return success.error;

  const value = selected ?? (OPTIONS.some((o) => o.value === locale) ? locale : "en_US");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure(null);
    try {
      setChanged(await setLocale(value));
    } catch (err) {
      setFailure(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">{screen.definition.title}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{screen.definition.message}</p>
      <form onSubmit={submit} className="max-w-md space-y-4 rounded-lg border p-4">
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Current language</span>
          <span className="font-mono">{locale}</span>
        </p>
        <div className="space-y-1.5">
          <label htmlFor="locale" className="text-sm font-medium">
            {screen.definition.label}
          </label>
          <select
            id="locale"
            name="locale"
            value={value}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-background h-9 w-full rounded-lg border px-3 text-sm"
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            German has no pages of its own yet — choosing it keeps the store in US English.
          </p>
        </div>
        <Button type="submit">
          <Globe aria-hidden="true" />
          Change Locale
        </Button>
        {failure ? (
          <p role="alert" className="text-sm text-red-600">
            {failure}
          </p>
        ) : null}
        {changed ? (
          <p role="status" className="bg-muted rounded-lg border p-3 text-sm">
            <strong>{success.definition.title}</strong> {success.definition.message}{" "}
            <span className="font-mono">{changed}</span>
          </p>
        ) : null}
      </form>
    </div>
  );
}

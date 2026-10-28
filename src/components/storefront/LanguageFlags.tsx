import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

const FLAGS = [
  { locale: "en_US", key: "en", text: "EN" },
  { locale: "ja_JP", key: "ja", text: "JA" },
  { locale: "zh_CN", key: "zh", text: "ZH" },
] as const;

export default function LanguageFlags() {
  const { locale, setLocale } = useLocale();
  const screen = useScreen("header", locale);
  const title = "error" in screen ? "Language" : screen.definition.title;

  return (
    <div role="group" aria-label={title} className="mb-4 flex justify-end gap-1">
      {FLAGS.map((flag) => (
        <button
          key={flag.locale}
          type="button"
          aria-label={"error" in screen ? flag.text : screen.definition[flag.key]}
          aria-pressed={locale === flag.locale}
          onClick={() => void setLocale(flag.locale)}
          className="hover:bg-muted focus-visible:outline-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground rounded-lg border px-3 py-1 text-sm font-medium outline-none focus-visible:outline-2"
        >
          {flag.text}
        </button>
      ))}
    </div>
  );
}

import { Search } from "lucide-react";
import { useNavigate } from "react-router";

import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

/** The header keyword search: submitting opens /petstore/search?q=. */
export default function SearchBox() {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const t = "error" in screen ? null : screen.definition;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        void navigate(`/petstore/search?${new URLSearchParams({ q: text })}`);
      }}
      className="bg-muted/40 text-muted-foreground flex h-9 max-w-lg flex-1 items-center gap-2 rounded-lg border px-3"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <input
        type="search"
        name="q"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t?.searchLabel ?? "Search"}
        placeholder={t?.searchPlaceholder ?? "Search pets by keyword"}
        className="text-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
    </form>
  );
}

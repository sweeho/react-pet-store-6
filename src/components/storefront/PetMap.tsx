import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

// Pet regions in the picture's left-to-right order; the category ids are the catalog codes.
const REGIONS = [
  { id: "BIRDS", name: "Birds" },
  { id: "FISH", name: "Fish" },
  { id: "DOGS", name: "Dogs" },
  { id: "REPTILES", name: "Reptiles" },
  { id: "CATS", name: "Cats" },
] as const;

const WIDTH = 1000;
const HEIGHT = 300;

/** The home screen's pet selection picture: overlay links, one selectable region per pet. */
export default function PetMap() {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const t = "error" in screen ? null : screen.definition;

  return (
    <section className="bg-background overflow-hidden rounded-lg border">
      <div className="relative">
        <img
          src="/images/splash.svg"
          alt={t?.mapLabel ?? "Pet selection map"}
          width={WIDTH}
          height={HEIGHT}
          className="block h-auto w-full"
        />
        {REGIONS.map((r, i) => (
          <Link
            key={r.id}
            to={`/petstore/category/${r.id}`}
            aria-label={r.name}
            className="focus-visible:outline-ring absolute top-0 h-full w-1/5 outline-none focus-visible:outline-2"
            style={{ left: `${i * 20}%` }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-5 border-t">
        {REGIONS.map((r) => (
          <li key={r.id} className="border-r last:border-r-0">
            <Link
              to={`/petstore/category/${r.id}`}
              aria-label={r.name}
              className="hover:text-primary focus-visible:outline-ring flex items-center justify-between p-4 outline-none focus-visible:outline-2"
            >
              <span>
                <span className="block text-base font-semibold">{r.name}</span>
                <span className="text-muted-foreground font-mono text-xs">{r.id}</span>
              </span>
              <ChevronRight className="text-muted-foreground size-4" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

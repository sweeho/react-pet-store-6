import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

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

/** The home screen's pet selection picture: an image map with one selectable region per pet. */
export default function PetMap() {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const navigate = useNavigate();
  const t = "error" in screen ? null : screen.definition;
  const regionWidth = WIDTH / REGIONS.length;

  return (
    <section className="bg-background overflow-hidden rounded-lg border">
      <img
        src="/images/splash.svg"
        alt={t?.mapLabel ?? "Pet selection map"}
        useMap="#petmap"
        width={WIDTH}
        height={HEIGHT}
        className="h-[300px] w-full object-fill"
      />
      <map name="petmap">
        {REGIONS.map((r, i) => (
          <area
            key={r.id}
            shape="rect"
            coords={`${i * regionWidth},0,${(i + 1) * regionWidth},${HEIGHT}`}
            href={`/petstore/category/${r.id}`}
            alt={r.name}
            onClick={(e) => {
              e.preventDefault();
              void navigate(`/petstore/category/${r.id}`);
            }}
          />
        ))}
      </map>
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

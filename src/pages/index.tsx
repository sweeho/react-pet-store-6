import { ChevronRight, LayoutGrid, PawPrint } from "lucide-react";
import { Link } from "react-router";

import { AppShell } from "@/components/shell/AppShell";
import { primaryAreas } from "@/components/shell/areas";

const categories = [
  { name: "Birds", products: ["Amazon Parrot", "Finch"], count: 2 },
  { name: "Fish", products: ["Angelfish", "Tiger Shark", "Koi", "Goldfish"], count: 4 },
  { name: "Dogs", products: ["Bulldog", "Poodle", "Dalmation", "Golden Retriever …"], count: 6 },
  { name: "Reptiles", products: ["Rattlesnake", "Iguana"], count: 2 },
  { name: "Cats", products: ["Manx", "Persian"], count: 2 },
];

const card = "rounded-lg border border-slate-200 bg-white";

const Home = () => (
  <AppShell>
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Welcome to Pet Store</h1>
        <p className="mt-1 text-slate-500">
          Pick a pet to browse, or search the whole catalog from the bar above.
        </p>
      </div>
      <Link
        to="/petstore"
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white"
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        Browse the catalog
      </Link>
    </div>

    <h2 className="mb-3 flex justify-between text-xs font-semibold text-slate-500">
      <span>CHOOSE A PET</span>
      <span className="font-normal">5 categories · 16 products</span>
    </h2>
    <div className="mb-8 grid grid-cols-5 gap-4">
      {categories.map((c) => (
        <Link
          key={c.name}
          to={`/petstore/category/${c.name.toLowerCase()}`}
          className={`${card} overflow-hidden`}
        >
          <div className="grid h-[120px] place-items-center border-b border-slate-200 bg-slate-50 text-indigo-600">
            <PawPrint className="size-10" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between px-4 pt-3 text-base font-semibold">
            {c.name}
            <ChevronRight className="size-4 text-slate-500" aria-hidden="true" />
          </div>
          <div className="px-4 pt-0.5 text-xs text-slate-500">{c.count} products</div>
          <div className="truncate px-4 pt-2 pb-4 text-xs">{c.products.join(" · ")}</div>
        </Link>
      ))}
    </div>

    <h2 className="mb-3 text-xs font-semibold text-slate-500">EVERYTHING IN THE STORE</h2>
    <div className="grid grid-cols-3 gap-3">
      {primaryAreas.map((a) => (
        <Link key={a.key} to={a.href} className={`${card} flex items-start gap-3 p-4`}>
          <span className="grid size-8 flex-none place-items-center rounded-lg border border-slate-200 bg-slate-50 text-indigo-600">
            <a.icon className="size-4" aria-hidden="true" />
          </span>
          <span>
            <span className="flex items-center gap-2 font-semibold">
              {a.name}
              {a.staff && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-500">
                  Staff sign-in
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs/[18px] text-slate-500">{a.description}</span>
          </span>
        </Link>
      ))}
    </div>
  </AppShell>
);

export default Home;

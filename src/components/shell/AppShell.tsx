import { Link } from "react-router";
import { LogIn, PawPrint, Search, ShoppingCart, User } from "lucide-react";
import type { ReactNode } from "react";

import { GlobalNav } from "./GlobalNav";

const ghost = "flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-900";

/** The one page layout: header, global navigation, content outlet and footer. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] grid-rows-[56px_1fr_40px] bg-white font-sans text-sm text-slate-900">
      <header className="col-span-2 flex items-center gap-4 border-b border-slate-200 bg-white pr-6 pl-4">
        <Link to="/" className="flex w-52 items-center gap-2 text-base font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white">
            <PawPrint className="size-4" aria-hidden="true" />
          </span>
          Pet Store
        </Link>
        <div className="flex h-9 max-w-[520px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500">
          <Search className="size-4" aria-hidden="true" />
          <span>Search pets by keyword — e.g. “angelfish”</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div
            aria-label="Language"
            className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-medium"
          >
            {["English", "日本語", "中文"].map((l, i) => (
              <span
                key={l}
                className={`flex h-8 items-center border-r border-slate-200 px-3 last:border-r-0 ${i === 0 ? "bg-indigo-600 text-white" : "text-slate-500"}`}
              >
                {l}
              </span>
            ))}
          </div>
          <Link to="/petstore/cart" className={ghost}>
            <ShoppingCart className="size-4" aria-hidden="true" />
            Cart
          </Link>
          <Link to="/petstore/signin" className={ghost}>
            <User className="size-4" aria-hidden="true" />
            Account
          </Link>
          <Link
            to="/petstore/signin"
            className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </Link>
        </div>
      </header>
      <GlobalNav />
      <main className="overflow-auto bg-white px-8 py-6">{children}</main>
      <footer className="col-start-2 flex items-center gap-4 border-t border-slate-200 px-8 text-xs text-slate-500">
        <span>Pet Store</span>
        <span>·</span>
        <Link to="/">Home</Link>
        <span className="flex-1" />
        <span>English (US)</span>
      </footer>
    </div>
  );
}

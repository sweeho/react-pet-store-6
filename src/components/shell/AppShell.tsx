import { PawPrint, ShoppingCart, User } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import GlobalNav from "./GlobalNav";

export interface AppShellProps {
  children: ReactNode;
  headerSlot?: ReactNode;
}

export default function AppShell({ children, headerSlot }: AppShellProps) {
  return (
    <div className="bg-background text-foreground flex h-dvh flex-col md:grid md:grid-cols-[15rem_1fr] md:grid-rows-[3.5rem_1fr_2.5rem]">
      <header className="border-border flex h-14 shrink-0 items-center gap-4 border-b px-4 md:col-span-2 md:pr-6">
        <Link to="/" className="flex items-center gap-2 text-base font-semibold md:w-52">
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg">
            <PawPrint aria-hidden="true" className="size-4" />
          </span>
          Pet Store
        </Link>
        <div className="flex min-w-0 flex-1 items-center">{headerSlot}</div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link to="/petstore/cart" className="flex h-8 items-center gap-2 px-3">
            <ShoppingCart aria-hidden="true" className="size-4" />
            Cart
          </Link>
          <Link to="/petstore/account" className="hidden h-8 items-center gap-2 px-3 sm:flex">
            <User aria-hidden="true" className="size-4" />
            Account
          </Link>
          <Link
            to="/petstore/signin"
            className="border-border flex h-8 items-center rounded-lg border px-3"
          >
            Sign in
          </Link>
        </div>
      </header>
      <GlobalNav />
      <main className="min-h-0 flex-1 overflow-auto md:row-span-1">{children}</main>
      <footer className="border-border text-muted-foreground flex h-10 shrink-0 items-center gap-4 border-t px-8 text-xs md:col-start-2">
        <span>Pet Store</span>
        <span aria-hidden="true">·</span>
        <Link to="/">Home</Link>
        <span className="flex-1" />
        <span>English (US)</span>
      </footer>
    </div>
  );
}

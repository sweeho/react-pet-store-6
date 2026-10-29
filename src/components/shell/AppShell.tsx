import { Dialog, DialogPanel } from "@headlessui/react";
import { Menu, PawPrint, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";

import SearchBox from "@/components/storefront/SearchBox";

import GlobalNav from "./GlobalNav";

export interface AppShellProps {
  children?: ReactNode;
  header?: ReactNode;
}

export default function AppShell({ children, header }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="grid h-screen grid-cols-1 grid-rows-[56px_1fr_40px] lg:grid-cols-[240px_1fr]">
      <header className="bg-background flex items-center gap-4 border-b px-4 lg:col-span-2 lg:pr-6">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="focus-visible:outline-ring rounded-lg p-1.5 outline-none focus-visible:outline-2 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <Link
          to="/"
          className="focus-visible:outline-ring flex items-center gap-2 text-base font-semibold outline-none focus-visible:outline-2 lg:w-52"
        >
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg">
            <PawPrint className="size-4" aria-hidden="true" />
          </span>
          Pet Store
        </Link>
        {header ?? <SearchBox />}
      </header>
      <div className="bg-muted/40 row-span-2 hidden border-r lg:block">
        <GlobalNav />
      </div>
      <Dialog open={menuOpen} onClose={setMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-40 bg-black/30" aria-hidden="true" />
        <DialogPanel className="bg-background fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto shadow-lg">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="focus-visible:outline-ring m-3 rounded-lg p-1.5 outline-none focus-visible:outline-2"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <GlobalNav />
        </DialogPanel>
      </Dialog>
      <main className="overflow-auto px-8 py-6">{children ?? <Outlet />}</main>
      <footer className="text-muted-foreground flex items-center gap-4 border-t px-8 text-xs lg:col-start-2">
        <span>Pet Store</span>
        <span aria-hidden="true">·</span>
        <Link to="/" className="hover:underline">
          Home
        </Link>
      </footer>
    </div>
  );
}

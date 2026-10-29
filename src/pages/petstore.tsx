import { Outlet } from "react-router";

import CategoryPanel from "@/components/storefront/CategoryPanel";
import LanguageFlags from "@/components/storefront/LanguageFlags";
import { LocaleProvider } from "@/components/storefront/LocaleProvider";

export default function Layout() {
  return (
    <LocaleProvider>
      <LanguageFlags />
      <div className="flex flex-col gap-6 lg:flex-row">
        <CategoryPanel />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </LocaleProvider>
  );
}

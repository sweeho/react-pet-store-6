import { Outlet } from "react-router";

import LanguageFlags from "@/components/storefront/LanguageFlags";
import { LocaleProvider } from "@/components/storefront/LocaleProvider";

export default function Layout() {
  return (
    <LocaleProvider>
      <LanguageFlags />
      <Outlet />
    </LocaleProvider>
  );
}

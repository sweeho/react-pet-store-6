import { Outlet } from "react-router";

import CategoryPanel from "@/components/storefront/CategoryPanel";
import MyListPanel from "@/components/storefront/MyListPanel";

export default function Layout() {
  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row">
        <CategoryPanel />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
        <MyListPanel />
      </div>
    </>
  );
}

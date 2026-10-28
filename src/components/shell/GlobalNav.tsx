import { Home, Lock } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/utils/cn";

import { primaryAreas } from "./areas";

const groups = ["Shop", "You", "Store staff"] as const;

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium",
    isActive ? "bg-indigo-600 text-white" : "text-slate-900 hover:bg-slate-100",
  );

export function GlobalNav() {
  return (
    <nav
      aria-label="Global"
      className="row-span-2 flex flex-col gap-4 overflow-hidden border-r border-slate-200 bg-slate-50 px-3 py-4"
    >
      {groups.map((group) => (
        <div key={group}>
          <h6 className="px-2 pb-1 text-xs font-semibold tracking-wide text-slate-500">{group}</h6>
          {group === "Shop" && (
            <NavLink to="/" end className={itemClass}>
              <Home className="size-4" aria-hidden="true" />
              Home
            </NavLink>
          )}
          {primaryAreas
            .filter((a) => a.group === group)
            .map((a) => (
              <NavLink key={a.key} to={a.href} className={itemClass}>
                <a.icon className="size-4" aria-hidden="true" />
                {a.name}
                {a.staff && (
                  <Lock className="ml-auto size-3 text-slate-500" aria-label="Separate sign-in" />
                )}
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  );
}

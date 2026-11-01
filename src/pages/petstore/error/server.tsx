import { TriangleAlert } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

interface FailureState {
  message?: string;
  trace?: string;
}

export default function ServerErrorPage() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-checkout", locale);
  const state = (useLocation().state ?? {}) as FailureState;
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t.serverTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.serverSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
            {t.backHome}
          </Link>
          <Link to="/petstore/cart" className={buttonVariants()}>
            {t.backToCart}
          </Link>
        </div>
      </div>
      <div
        role="alert"
        className="bg-background flex gap-3 rounded-lg border border-l-[3px] border-l-red-600 p-4"
      >
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <b className="font-semibold">
            {t.serverHeadline}{" "}
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              {t.serverBadge}
            </span>
          </b>
          <p className="text-muted-foreground mt-1 text-sm">{t.serverNotify}</p>
          <div className="bg-muted mt-3 rounded-md border px-3 py-2 font-mono text-sm">
            {state.message || t.serverNoMessage}
          </div>
        </div>
      </div>
      {state.trace ? (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="bg-muted text-muted-foreground flex justify-between px-4 py-2 text-xs font-semibold uppercase">
            <span>{t.trace}</span>
            <span className="font-normal normal-case">{t.traceFor}</span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">{state.trace}</pre>
        </div>
      ) : null}
    </div>
  );
}

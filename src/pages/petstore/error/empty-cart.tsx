import { Inbox } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

export default function EmptyCartErrorPage() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-checkout", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.emptySubtitle}</p>
      </div>
      <div
        data-testid="empty-frame"
        className="bg-muted flex min-h-[320px] flex-col items-center justify-center rounded-lg border px-6 py-12 text-center"
      >
        <div className="bg-background text-muted-foreground mb-4 grid size-12 place-items-center rounded-full border">
          <Inbox className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mb-1 text-base font-semibold">{t.emptyTitle}</h2>
        <p className="text-muted-foreground mb-4 max-w-md text-sm">{t.emptyBody}</p>
        <div className="flex gap-2">
          <Link to="/petstore" className={buttonVariants()}>
            {t.browse}
          </Link>
          <Link to="/petstore/cart" className={buttonVariants({ variant: "secondary" })}>
            {t.viewCart}
          </Link>
        </div>
      </div>
    </div>
  );
}

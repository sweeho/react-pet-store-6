import { CircleAlert } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

export default function UserCreationError() {
  const { locale } = useLocale();
  const screen = useScreen("account", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;

  return (
    <div className="flex justify-center pt-8">
      <div role="alert" className="bg-background w-full max-w-lg rounded-lg border p-8">
        <span className="bg-destructive/10 text-destructive mb-4 grid size-10 place-items-center rounded-full">
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t.errorTitle}
        </p>
        <h1 className="mt-1 mb-2 text-2xl font-semibold">{t.errorHeading}</h1>
        <p className="text-muted-foreground leading-relaxed">{t.errorMessage}</p>
        <div className="mt-6 flex gap-2">
          <Link to="/petstore/signin" className={buttonVariants()}>
            {t.errorAgain}
          </Link>
          <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
            {t.errorHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

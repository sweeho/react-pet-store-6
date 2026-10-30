import { Check } from "lucide-react";
import { Link } from "react-router";

import { useLocale } from "@/components/storefront/LocaleProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { useScreen } from "@/locales/useScreen";

export default function SignedOut() {
  const { locale } = useLocale();
  const screen = useScreen("signon", locale);
  if ("error" in screen) return screen.error;
  const t = screen.definition;

  return (
    <div className="flex justify-center pt-16">
      <div className="bg-background w-full max-w-md rounded-lg border p-8 text-center">
        <span className="text-primary mx-auto mb-4 grid size-12 place-items-center rounded-full border">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold">{t.signedOutTitle}</h1>
        <p className="text-muted-foreground mt-2 mb-6 text-sm">{t.signedOutMessage}</p>
        <div className="flex justify-center gap-2">
          <Link to="/petstore/signin" className={buttonVariants()}>
            {t.signInAgain}
          </Link>
          <Link to="/petstore" className={buttonVariants({ variant: "secondary" })}>
            {t.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

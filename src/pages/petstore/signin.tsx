import { Link } from "react-router";

import EmptyFrame from "@/components/shell/EmptyFrame";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { useScreen } from "@/locales/useScreen";

export default function PetstoreSignin() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-signin", locale);
  if ("error" in screen) return screen.error;
  const { title, message } = screen.definition;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
      <EmptyFrame
        message={message}
        action={
          <Link to="/" className="text-primary text-sm font-medium hover:underline">
            Back to home
          </Link>
        }
      />
    </div>
  );
}

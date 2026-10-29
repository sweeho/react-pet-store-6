import PetMap from "@/components/storefront/PetMap";
import { useLocale } from "@/components/storefront/LocaleProvider";
import { useScreen } from "@/locales/useScreen";

export default function PetstoreHome() {
  const { locale } = useLocale();
  const screen = useScreen("petstore-home", locale);
  const catalog = useScreen("catalog", locale);
  if ("error" in screen) return screen.error;
  const { title, message } = screen.definition;
  const choosePet = "error" in catalog ? "Choose a pet" : catalog.definition.choosePet;

  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground mt-1 mb-6">{message}</p>
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        {choosePet}
      </h2>
      <PetMap />
    </div>
  );
}

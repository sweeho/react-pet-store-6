import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui";
import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

/** Adds one of `itemId` to the shopper's cart through POST /api/cart/items, then shows the cart. */
export default function AddToCart({ itemId, size }: { itemId: string; size?: "sm" | "default" }) {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "added" | "failed">("idle");
  if ("error" in screen) return screen.error;
  const t = screen.definition;

  const add = async () => {
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      setState(res.ok ? "added" : "failed");
      if (res.ok) void navigate("/petstore/cart");
    } catch {
      setState("failed");
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" size={size} onClick={() => void add()}>
        <ShoppingCart aria-hidden="true" />
        {t.addToCart}
        {/* The legacy button is an image whose name is always "Add to Cart"; keep that name in every language. */}
        {locale === "en_US" ? null : <span className="sr-only"> (Add to Cart)</span>}
      </Button>
      {state === "idle" ? null : (
        <span role="status" className="text-muted-foreground text-xs">
          {state === "added" ? t.added : t.addFailed}
        </span>
      )}
    </span>
  );
}

import ErrorFrame from "@/components/shell/ErrorFrame";

import { resolveScreen } from "./resolveScreen";
import type { ResolvedScreen } from "./resolveScreen";

export type UseScreenResult = ResolvedScreen | { error: React.ReactElement };

/** Resolves a screen for a page; on failure returns the ErrorFrame to render instead. */
export function useScreen(screen: string, sessionLocale: string): UseScreenResult {
  const requestLocale = new URLSearchParams(useLocation().search).get("locale") ?? undefined;
  try {
    return resolveScreen({ screen, requestLocale, sessionLocale });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      error: (
        <ErrorFrame
          title="Screen not available"
          message={message}
          onRetry={() => window.location.reload()}
        />
      ),
    };
  }
}

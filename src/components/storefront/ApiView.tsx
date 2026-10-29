import type { ReactNode } from "react";

import ErrorFrame from "@/components/shell/ErrorFrame";
import LoadingFrame from "@/components/shell/LoadingFrame";
import { useApi } from "@/hooks/useApi";
import { useScreen } from "@/locales/useScreen";

import { useLocale } from "./LocaleProvider";

interface ApiViewProps<T> {
  url: string;
  children: (data: T) => ReactNode;
}

/** Loads `url` and renders `children` with the data, or the shared Loading / Error frames. */
export default function ApiView<T>({ url, children }: ApiViewProps<T>) {
  const { locale } = useLocale();
  const screen = useScreen("catalog", locale);
  const { data, error, loading, retry } = useApi<T>(url);
  const t = "error" in screen ? null : screen.definition;

  if (error)
    return (
      <ErrorFrame
        title={t?.errorTitle}
        message={t?.errorMessage ?? error.message}
        onRetry={retry}
      />
    );
  if (loading || data === null) return <LoadingFrame label={t?.loading} />;
  return <>{children(data)}</>;
}

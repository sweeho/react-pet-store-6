import { DEFAULT_LOCALE } from "../../shared/i18n/locale";
import { registry } from "./registry";
import type { ScreenDefinition } from "./types";

export interface ResolveScreenArgs {
  screen: string;
  requestLocale?: string;
  sessionLocale: string;
}

export interface ResolvedScreen {
  locale: string;
  definition: ScreenDefinition;
}

/**
 * Request locale wins over session locale; a locale without the screen (or without
 * any definitions) falls back to en_US; a screen missing everywhere is an error.
 */
export function resolveScreen({
  screen,
  requestLocale,
  sessionLocale,
}: ResolveScreenArgs): ResolvedScreen {
  for (const locale of [requestLocale ?? sessionLocale, DEFAULT_LOCALE]) {
    const definition = registry[locale]?.[screen];
    if (definition) return { locale, definition };
  }
  throw new Error(`Definition for screen ${screen} not found`);
}

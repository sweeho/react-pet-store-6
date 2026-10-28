/** Text for one storefront screen in one locale; keys beyond `title` are screen-specific. */
export interface ScreenDefinition {
  title: string;
  [key: string]: string;
}

export type LocaleRegistry = Record<string, Record<string, ScreenDefinition>>;

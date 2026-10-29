import { formatMoney } from "../../../shared/i18n/format";

export interface CatalogPageData<T> {
  items: T[];
  start: number;
  size: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousStart: number;
  nextStart: number;
}

export interface CategoryData {
  categoryId: string;
  name: string;
  description: string;
  image: string;
}

export interface ProductData {
  productId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
}

export interface ItemData {
  itemId: string;
  productId: string;
  /** The product's name. */
  name: string;
  description: string;
  image: string;
  listPrice: number;
  unitCost: number;
}

export const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

/** Catalog image names are bare file names (`fish1.jpg`) or absolute paths. */
export function imageSrc(image: string): string {
  if (!image) return PLACEHOLDER_IMAGE;
  return image.startsWith("/") || image.startsWith("http") ? image : `/images/${image}`;
}

/** Prices are integer hundredths of the displayed unit; yen shows no decimals. */
export function money(hundredths: number, locale: string): string {
  return formatMoney(hundredths / 100, locale, locale === "ja_JP" ? 0 : 2);
}

export const apiUrl = (
  path: string,
  locale: string,
  params: Record<string, string | number> = {},
) => {
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    locale,
  });
  return `${path}?${query}`;
};

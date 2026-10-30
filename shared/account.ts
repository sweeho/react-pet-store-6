/** The payment card types the account form offers (SWHR2-R-0010). */
export const CARD_TYPES = ["Java(TM) Card", "Duke Express", "Meow Card"] as const;

/** The fixed expiry years; provisional until the SME confirms the window (design P9). */
export const EXPIRY_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035] as const;

export const EXPIRY_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Favourite categories the pet-tips banner recognises; anything else shows dogs. */
export const BANNER_CATEGORIES = ["dogs", "cats", "reptiles", "birds", "fish"] as const;

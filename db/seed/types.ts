/** Shape of `db/seed/petstore.json`, the one editable UTF-8 seed data set. Prices are integer hundredths. */
export const SEED_LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;
export type SeedLocale = (typeof SEED_LOCALES)[number];

export interface SeedUser {
  userId: string;
  /** Hashed with Bun.password on load. */
  password: string;
}

export interface SeedCustomer {
  userId: string;
  account: {
    contact: {
      givenName: string;
      familyName: string;
      telephone: string;
      email: string;
      address: {
        street1: string;
        street2: string;
        city: string;
        state: string;
        zip: string;
        country: string;
      };
    };
    card: { cardNumber: string; cardType: string; expiryMonth: number; expiryYear: number };
  };
  profile: {
    preferredLanguage: string;
    favouriteCategory: string | null;
    myListOn: boolean;
    bannerOn: boolean;
  };
}

export interface SeedCategory {
  id: string;
  details: Record<SeedLocale, { name: string; description: string; image: string }>;
}

export interface SeedProduct {
  id: string;
  categoryId: string;
  details: Record<SeedLocale, { name: string; description: string; image: string }>;
}

export interface SeedItem {
  id: string;
  productId: string;
  details: Record<
    SeedLocale,
    {
      description: string;
      image: string;
      listPrice: number;
      unitCost: number;
      /** Up to five attributes. */
      attributes: string[];
    }
  >;
}

export interface SeedInventoryEntry {
  itemId: string;
  /** A missing quantity is seeded as 0. */
  quantity?: number;
}

export interface SeedData {
  users: SeedUser[];
  customers: SeedCustomer[];
  categories: SeedCategory[];
  products: SeedProduct[];
  items: SeedItem[];
  inventory: SeedInventoryEntry[];
}

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_catalog_item_details` (
	`item_id` text NOT NULL,
	`locale` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`list_price` integer NOT NULL,
	`unit_cost` integer NOT NULL,
	`attr1` text,
	`attr2` text,
	`attr3` text,
	`attr4` text,
	`attr5` text,
	PRIMARY KEY(`item_id`, `locale`),
	FOREIGN KEY (`item_id`) REFERENCES `catalog_items`(`item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_catalog_item_details`("item_id", "locale", "description", "image", "list_price", "unit_cost", "attr1", "attr2", "attr3", "attr4", "attr5") SELECT "item_id", "locale", "description", "image", CAST(ROUND("list_price" * 100) AS integer), CAST(ROUND("unit_cost" * 100) AS integer), "attr1", "attr2", "attr3", "attr4", "attr5" FROM `catalog_item_details`;--> statement-breakpoint
DROP TABLE `catalog_item_details`;--> statement-breakpoint
ALTER TABLE `__new_catalog_item_details` RENAME TO `catalog_item_details`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_catalog_items` (
	`item_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `catalog_products`(`product_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_catalog_items`("item_id", "product_id") SELECT "item_id", "product_id" FROM `catalog_items`;--> statement-breakpoint
DROP TABLE `catalog_items`;--> statement-breakpoint
ALTER TABLE `__new_catalog_items` RENAME TO `catalog_items`;--> statement-breakpoint
CREATE INDEX `catalog_items_product_idx` ON `catalog_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `__new_catalog_products` (
	`product_id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `catalog_categories`(`category_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_catalog_products`("product_id", "category_id") SELECT "product_id", "category_id" FROM `catalog_products`;--> statement-breakpoint
DROP TABLE `catalog_products`;--> statement-breakpoint
ALTER TABLE `__new_catalog_products` RENAME TO `catalog_products`;--> statement-breakpoint
CREATE INDEX `catalog_products_category_idx` ON `catalog_products` (`category_id`);--> statement-breakpoint
CREATE TABLE `__new_catalog_categories` (
	`category_id` text PRIMARY KEY NOT NULL,
	CONSTRAINT "catalog_categories_id_length" CHECK(length("__new_catalog_categories"."category_id") <= 10)
);
--> statement-breakpoint
INSERT INTO `__new_catalog_categories`("category_id") SELECT "category_id" FROM `catalog_categories`;--> statement-breakpoint
DROP TABLE `catalog_categories`;--> statement-breakpoint
ALTER TABLE `__new_catalog_categories` RENAME TO `catalog_categories`;--> statement-breakpoint
CREATE TABLE `__new_catalog_category_details` (
	`category_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	PRIMARY KEY(`category_id`, `locale`),
	FOREIGN KEY (`category_id`) REFERENCES `catalog_categories`(`category_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_catalog_category_details`("category_id", "locale", "name", "description", "image") SELECT "category_id", "locale", "name", "description", "image" FROM `catalog_category_details`;--> statement-breakpoint
DROP TABLE `catalog_category_details`;--> statement-breakpoint
ALTER TABLE `__new_catalog_category_details` RENAME TO `catalog_category_details`;--> statement-breakpoint
CREATE TABLE `__new_catalog_product_details` (
	`product_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	PRIMARY KEY(`product_id`, `locale`),
	FOREIGN KEY (`product_id`) REFERENCES `catalog_products`(`product_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_catalog_product_details`("product_id", "locale", "name", "description", "image") SELECT "product_id", "locale", "name", "description", "image" FROM `catalog_product_details`;--> statement-breakpoint
DROP TABLE `catalog_product_details`;--> statement-breakpoint
ALTER TABLE `__new_catalog_product_details` RENAME TO `catalog_product_details`;
CREATE TABLE `catalog_categories` (
	`category_id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_category_details` (
	`category_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	PRIMARY KEY(`category_id`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `catalog_item_details` (
	`item_id` text NOT NULL,
	`locale` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`list_price` real NOT NULL,
	`unit_cost` real NOT NULL,
	`attr1` text,
	`attr2` text,
	`attr3` text,
	`attr4` text,
	`attr5` text,
	PRIMARY KEY(`item_id`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`item_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_product_details` (
	`product_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	PRIMARY KEY(`product_id`, `locale`)
);
--> statement-breakpoint
CREATE TABLE `catalog_products` (
	`product_id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL
);

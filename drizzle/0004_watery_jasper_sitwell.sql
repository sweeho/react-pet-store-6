CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`street1` text NOT NULL,
	`street2` text DEFAULT '' NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`country` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`telephone` text NOT NULL,
	`email` text NOT NULL,
	`address_id` integer NOT NULL,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`contact_id` integer NOT NULL,
	`card_number` text NOT NULL,
	`card_type` text NOT NULL,
	`card_expiry_month` integer NOT NULL,
	`card_expiry_year` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `customers`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contact_info`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "customer_accounts_status" CHECK("customer_accounts"."status" in ('active', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE `customer_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`preferred_language` text DEFAULT 'en_US' NOT NULL,
	`favourite_category` text,
	`my_list_on` integer DEFAULT true NOT NULL,
	`banner_on` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `customers`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`user_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `signon_users`(`user_id`) ON UPDATE no action ON DELETE no action
);

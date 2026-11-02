CREATE TABLE `id_sequences` (
	`prefix` text PRIMARY KEY NOT NULL,
	`next_value` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	CONSTRAINT "messages_status" CHECK("messages"."status" in ('pending', 'done', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `messages_channel_status_idx` ON `messages` (`channel`,`status`);--> statement-breakpoint
CREATE TABLE `op_order_workflow` (
	`order_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `op_po_cards` (
	`order_id` text PRIMARY KEY NOT NULL,
	`card_number` text NOT NULL,
	`card_type` text NOT NULL,
	`expiry_date` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `op_purchase_orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `op_po_contacts` (
	`order_id` text PRIMARY KEY NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`street` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`country` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `op_purchase_orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `op_po_line_items` (
	`order_id` text NOT NULL,
	`line_number` integer NOT NULL,
	`category_id` text NOT NULL,
	`product_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity_shipped` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`order_id`, `line_number`),
	FOREIGN KEY (`order_id`) REFERENCES `op_purchase_orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `op_purchase_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`locale` text NOT NULL,
	`order_date` integer NOT NULL,
	`total` integer NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`street` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zip` text NOT NULL,
	`country` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL
);

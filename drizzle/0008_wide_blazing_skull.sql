CREATE TABLE `sup_order_contacts` (
	`order_id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`street` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`country` text NOT NULL,
	`zip` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `sup_orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sup_order_lines` (
	`order_id` text NOT NULL,
	`line_number` integer NOT NULL,
	`category_id` text NOT NULL,
	`product_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`quantity_shipped` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`order_id`, `line_number`),
	FOREIGN KEY (`order_id`) REFERENCES `sup_orders`(`order_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sup_orders` (
	`order_id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`order_date` text NOT NULL,
	`user_id` text NOT NULL,
	CONSTRAINT "sup_orders_status" CHECK("sup_orders"."status" in ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED'))
);
--> statement-breakpoint
DROP INDEX `messages_channel_status_idx`;--> statement-breakpoint
ALTER TABLE `messages` ADD `subscriber` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `messages_channel_status_idx` ON `messages` (`channel`,`subscriber`,`status`,`available_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_op_order_workflow` (
	`order_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	CONSTRAINT "op_order_workflow_status" CHECK("__new_op_order_workflow"."status" in ('PENDING', 'APPROVED', 'DENIED', 'SHIPPED_PART', 'COMPLETED'))
);
--> statement-breakpoint
INSERT INTO `__new_op_order_workflow`("order_id", "status") SELECT "order_id", "status" FROM `op_order_workflow`;--> statement-breakpoint
DROP TABLE `op_order_workflow`;--> statement-breakpoint
ALTER TABLE `__new_op_order_workflow` RENAME TO `op_order_workflow`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
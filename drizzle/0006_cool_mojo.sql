PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`available_at` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "messages_status" CHECK("__new_messages"."status" in ('pending', 'delivered', 'failed'))
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "channel", "payload", "status", "error", "created_at", "available_at") SELECT "id", "channel", "payload", CASE WHEN "status" = 'done' THEN 'delivered' ELSE "status" END, "error", "created_at", 0 FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `messages_channel_status_idx` ON `messages` (`channel`,`status`);
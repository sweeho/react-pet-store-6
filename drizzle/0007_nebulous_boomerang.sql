CREATE TABLE `sup_inventory` (
	`item_id` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	CONSTRAINT "sup_inventory_quantity_integer" CHECK(typeof("sup_inventory"."quantity") = 'integer')
);

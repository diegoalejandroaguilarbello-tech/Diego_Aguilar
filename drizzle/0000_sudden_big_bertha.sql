CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`business` text DEFAULT '' NOT NULL,
	`whatsapp` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`project_type` text NOT NULL,
	`extras` text DEFAULT '[]' NOT NULL,
	`estimated_price` real NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'directo' NOT NULL,
	`campaign` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text DEFAULT 'directo' NOT NULL,
	`campaign` text DEFAULT '' NOT NULL,
	`path` text DEFAULT '/' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

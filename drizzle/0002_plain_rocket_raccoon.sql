ALTER TABLE `leads` ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `archived_at` text;--> statement-breakpoint
CREATE INDEX `leads_status_updated_idx` ON `leads` (`status`,`updated_at`);
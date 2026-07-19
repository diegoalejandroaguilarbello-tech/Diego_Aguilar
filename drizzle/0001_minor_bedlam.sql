CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`csrf_token_hash` text NOT NULL,
	`ip_hash` text DEFAULT '' NOT NULL,
	`user_agent_hash` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`technologies` text DEFAULT '[]' NOT NULL,
	`live_url` text DEFAULT '' NOT NULL,
	`repo_url` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`image_key` text DEFAULT '' NOT NULL,
	`image_alt` text DEFAULT '' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_public_order_idx` ON `projects` (`is_published`,`is_active`,`sort_order`);--> statement-breakpoint
INSERT OR IGNORE INTO `projects` (`slug`, `title`, `description`, `technologies`, `live_url`, `repo_url`, `image_alt`, `is_featured`, `is_published`, `is_active`, `sort_order`)
VALUES ('automundo-premium', 'Automundo Premium', 'Catálogo y administración para concesionarios.', '["Node.js","Express","MySQL","JWT"]', 'https://automundo-premium-production.up.railway.app', 'https://github.com/diegoalejandroaguilarbello-tech/automundo-premium', 'Vista previa de Automundo Premium', 1, 1, 1, 10);--> statement-breakpoint
INSERT OR IGNORE INTO `projects` (`slug`, `title`, `description`, `technologies`, `live_url`, `repo_url`, `image_alt`, `is_featured`, `is_published`, `is_active`, `sort_order`)
VALUES ('researchos', 'ResearchOS', 'Agente inteligente para investigación web.', '["FastAPI","React","Ollama"]', '', 'https://github.com/diegoalejandroaguilarbello-tech/webresearchagent', 'Vista previa de ResearchOS', 0, 1, 1, 20);--> statement-breakpoint
CREATE TABLE `security_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`key_hash` text DEFAULT '' NOT NULL,
	`ip_hash` text DEFAULT '' NOT NULL,
	`path` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_event_key_created_idx` ON `security_events` (`event_type`,`key_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `security_event_created_idx` ON `security_events` (`created_at`);--> statement-breakpoint
ALTER TABLE `leads` ADD `medium` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `landing_path` text DEFAULT '/' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `referrer` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `session_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `visitor_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `submission_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `leads_source_created_idx` ON `leads` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `leads_submission_created_idx` ON `leads` (`submission_hash`,`created_at`);--> statement-breakpoint
ALTER TABLE `visits` ADD `medium` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `landing_path` text DEFAULT '/' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `referrer` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `session_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `visitor_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `visits_source_created_idx` ON `visits` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `visits_session_path_idx` ON `visits` (`session_id`,`path`);

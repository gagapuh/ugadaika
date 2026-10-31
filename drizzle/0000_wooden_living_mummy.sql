CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`browser` text NOT NULL,
	`name` text NOT NULL,
	`picks` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `prediction_browser_event` ON `predictions` (`tournament_id`,`browser`);--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`players` text NOT NULL,
	`results` text,
	`active` integer DEFAULT 1 NOT NULL
);

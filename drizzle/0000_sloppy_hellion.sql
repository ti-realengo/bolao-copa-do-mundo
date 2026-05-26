CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`badge_code` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	`match_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_user_badge_unique` ON `achievements` (`user_id`,`badge_code`);--> statement-breakpoint
CREATE TABLE `allowed_domains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain` text NOT NULL,
	`is_wildcard` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_domains_domain_unique` ON `allowed_domains` (`domain`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`target` text,
	`metadata_json` text,
	`ip_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_dispatches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`template` text NOT NULL,
	`context_json` text,
	`sent_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `league_members` (
	`league_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`league_id`, `user_id`),
	FOREIGN KEY (`league_id`) REFERENCES `leagues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leagues` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`owner_id` text NOT NULL,
	`invite_code` text NOT NULL,
	`is_open` integer DEFAULT 1 NOT NULL,
	`max_members` integer DEFAULT 50 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leagues_invite_code_unique` ON `leagues` (`invite_code`);--> statement-breakpoint
CREATE TABLE `magic_links` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`ip_hash` text
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`external_id` text,
	`stage` text NOT NULL,
	`group_code` text,
	`round` integer,
	`home_team_id` integer,
	`away_team_id` integer,
	`scheduled_at` integer NOT NULL,
	`venue` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`home_score` integer,
	`away_score` integer,
	`home_score_et` integer,
	`away_score_et` integer,
	`home_score_pen` integer,
	`away_score_pen` integer,
	`winner_team_id` integer,
	`finished_at` integer,
	FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_external_id_unique` ON `matches` (`external_id`);--> statement-breakpoint
CREATE INDEX `matches_scheduled_idx` ON `matches` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `matches_status_idx` ON `matches` (`status`);--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`match_id` integer NOT NULL,
	`home_score` integer NOT NULL,
	`away_score` integer NOT NULL,
	`advancing_team_id` integer,
	`points` integer,
	`is_exact` integer DEFAULT 0 NOT NULL,
	`is_winner_correct` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `predictions_user_match_unique` ON `predictions` (`user_id`,`match_id`);--> statement-breakpoint
CREATE INDEX `predictions_match_idx` ON `predictions` (`match_id`);--> statement-breakpoint
CREATE TABLE `rankings_snapshot` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`exact_count` integer DEFAULT 0 NOT NULL,
	`winner_count` integer DEFAULT 0 NOT NULL,
	`special_points` integer DEFAULT 0 NOT NULL,
	`position` integer,
	`position_change` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text,
	`ip_hash` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `special_predictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`champion_team_id` integer,
	`runnerup_team_id` integer,
	`third_team_id` integer,
	`top_scorer_name` text,
	`first_eliminated_team_id` integer,
	`surprise_team_id` integer,
	`points` integer DEFAULT 0 NOT NULL,
	`locked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `special_predictions_user_id_unique` ON `special_predictions` (`user_id`);--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY NOT NULL,
	`external_id` integer,
	`code` text NOT NULL,
	`name_pt` text NOT NULL,
	`name_en` text NOT NULL,
	`name_es` text NOT NULL,
	`flag_url` text,
	`group_code` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teams_external_id_unique` ON `teams` (`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teams_code_unique` ON `teams` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`phone` text,
	`role` text DEFAULT 'participant' NOT NULL,
	`password_hash` text,
	`password_must_change` integer DEFAULT 0 NOT NULL,
	`totp_secret` text,
	`consent_lgpd` integer DEFAULT 0 NOT NULL,
	`consent_lgpd_at` integer,
	`created_at` integer NOT NULL,
	`last_login_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
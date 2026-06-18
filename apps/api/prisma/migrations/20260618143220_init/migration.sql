-- CreateEnum
CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'business');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'unpaid');

-- CreateEnum
CREATE TYPE "job_type" AS ENUM ('full_scrape', 'delta_scrape', 'media_download', 'export');

-- CreateEnum
CREATE TYPE "job_status" AS ENUM ('pending', 'running', 'complete', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('photo', 'video', 'document', 'audio', 'voice', 'sticker', 'animation');

-- CreateEnum
CREATE TYPE "alert_channel" AS ENUM ('email', 'slack_webhook', 'webhook');

-- CreateEnum
CREATE TYPE "export_format" AS ENUM ('csv', 'json');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "tier" "subscription_tier" NOT NULL DEFAULT 'free',
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "max_channels" INTEGER NOT NULL DEFAULT 3,
    "polling_interval_mins" INTEGER NOT NULL DEFAULT 60,
    "max_storage_bytes" BIGINT NOT NULL DEFAULT 524288000,
    "history_days" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "telegram_api_id" TEXT NOT NULL,
    "telegram_api_hash" TEXT NOT NULL,
    "encrypted_session" TEXT,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMPTZ,
    "auth_error" TEXT,
    "auth_error_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_channels" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "telegram_channel_id" BIGINT NOT NULL,
    "username" TEXT,
    "invite_hash" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "member_count" INTEGER,
    "photo_url" TEXT,
    "is_broadcast" BOOLEAN NOT NULL DEFAULT true,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "first_scraped_at" TIMESTAMPTZ,
    "last_scraped_at" TIMESTAMPTZ,
    "last_message_id" BIGINT,
    "last_checked_at" TIMESTAMPTZ,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "is_monitoring" BOOLEAN NOT NULL DEFAULT true,
    "monitoring_paused_reason" TEXT,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_member_history" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "member_count" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_member_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "telegram_message_id" BIGINT NOT NULL,
    "sender_id" BIGINT,
    "sender_name" TEXT,
    "sender_username" TEXT,
    "text" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "forward_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "reply_to_message_id" BIGINT,
    "forward_from_id" BIGINT,
    "forward_from_name" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMPTZ,
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "reactions" JSONB,
    "search_vector" tsvector,
    "telegram_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "r2_key" TEXT NOT NULL,
    "r2_bucket" TEXT NOT NULL,
    "media_type" "media_type" NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "duration_seconds" INTEGER,
    "is_downloaded" BOOLEAN NOT NULL DEFAULT false,
    "download_failed" BOOLEAN NOT NULL DEFAULT false,
    "download_error" TEXT,
    "downloaded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_usage" (
    "user_id" UUID NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_usage_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" UUID,
    "bullmq_job_id" TEXT,
    "type" "job_type" NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'pending',
    "progress_current" INTEGER NOT NULL DEFAULT 0,
    "progress_total" INTEGER,
    "messages_fetched" INTEGER,
    "media_downloaded" INTEGER,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" UUID,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "keywords" TEXT[],
    "regex_pattern" TEXT,
    "delivery_channel" "alert_channel" NOT NULL DEFAULT 'email',
    "delivery_target" TEXT,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 60,
    "last_triggered_at" TIMESTAMPTZ,
    "total_triggers" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_events" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "matched_keyword" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "delivery_error" TEXT,
    "triggered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "job_id" UUID,
    "format" "export_format" NOT NULL,
    "from_date" TIMESTAMPTZ,
    "to_date" TIMESTAMPTZ,
    "r2_key" TEXT,
    "file_size_bytes" BIGINT,
    "row_count" INTEGER,
    "download_url" TEXT,
    "expires_at" TIMESTAMPTZ,
    "status" "job_status" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_folders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_folder_members" (
    "folder_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channel_folder_members_pkey" PRIMARY KEY ("folder_id","channel_id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel_id" UUID,
    "url" TEXT NOT NULL,
    "secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_called_at" TIMESTAMPTZ,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_auth_id_idx" ON "users"("auth_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_user_id_key" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "tracked_channels_user_id_idx" ON "tracked_channels"("user_id");

-- CreateIndex
CREATE INDEX "tracked_channels_telegram_channel_id_idx" ON "tracked_channels"("telegram_channel_id");

-- CreateIndex
CREATE INDEX "tracked_channels_user_id_is_monitoring_idx" ON "tracked_channels"("user_id", "is_monitoring");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_channels_user_id_telegram_channel_id_key" ON "tracked_channels"("user_id", "telegram_channel_id");

-- CreateIndex
CREATE INDEX "channel_member_history_channel_id_recorded_at_idx" ON "channel_member_history"("channel_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "messages_channel_id_telegram_date_idx" ON "messages"("channel_id", "telegram_date" DESC);

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

-- CreateIndex
CREATE INDEX "messages_channel_id_telegram_message_id_idx" ON "messages"("channel_id", "telegram_message_id");

-- CreateIndex
CREATE INDEX "messages_channel_id_has_media_idx" ON "messages"("channel_id", "has_media");

-- CreateIndex
CREATE UNIQUE INDEX "messages_channel_id_telegram_message_id_key" ON "messages"("channel_id", "telegram_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_r2_key_key" ON "media_files"("r2_key");

-- CreateIndex
CREATE INDEX "media_files_message_id_idx" ON "media_files"("message_id");

-- CreateIndex
CREATE INDEX "media_files_channel_id_media_type_idx" ON "media_files"("channel_id", "media_type");

-- CreateIndex
CREATE INDEX "media_files_user_id_idx" ON "media_files"("user_id");

-- CreateIndex
CREATE INDEX "media_files_r2_key_idx" ON "media_files"("r2_key");

-- CreateIndex
CREATE INDEX "jobs_user_id_created_at_idx" ON "jobs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_channel_id_created_at_idx" ON "jobs"("channel_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules"("user_id");

-- CreateIndex
CREATE INDEX "alert_rules_channel_id_idx" ON "alert_rules"("channel_id");

-- CreateIndex
CREATE INDEX "alert_rules_user_id_is_active_idx" ON "alert_rules"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "alert_events_rule_id_triggered_at_idx" ON "alert_events"("rule_id", "triggered_at" DESC);

-- CreateIndex
CREATE INDEX "exports_user_id_created_at_idx" ON "exports"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "channel_folders_user_id_name_key" ON "channel_folders"("user_id", "name");

-- CreateIndex
CREATE INDEX "webhook_endpoints_user_id_idx" ON "webhook_endpoints"("user_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_channels" ADD CONSTRAINT "tracked_channels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_member_history" ADD CONSTRAINT "channel_member_history_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_usage" ADD CONSTRAINT "storage_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_folders" ADD CONSTRAINT "channel_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_folder_members" ADD CONSTRAINT "channel_folder_members_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "channel_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_folder_members" ADD CONSTRAINT "channel_folder_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "tracked_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

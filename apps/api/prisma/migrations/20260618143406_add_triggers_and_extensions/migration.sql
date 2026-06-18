-- =============================================================================
-- Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- updated_at trigger function + apply to all tables
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users', 'subscriptions', 'api_keys', 'tracked_channels',
        'messages', 'media_files', 'jobs', 'alert_rules',
        'exports', 'channel_folders', 'webhook_endpoints'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- messages search_vector trigger
-- =============================================================================
CREATE OR REPLACE FUNCTION messages_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.text, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_messages_search_vector
    BEFORE INSERT OR UPDATE OF text
    ON messages
    FOR EACH ROW EXECUTE FUNCTION messages_search_vector_update();

-- =============================================================================
-- GIN index on messages.search_vector
-- =============================================================================
CREATE INDEX idx_messages_search_vector ON messages USING GIN (search_vector);

-- =============================================================================
-- Partial indexes (WHERE clause filtering — Prisma cannot model these)
-- =============================================================================
CREATE INDEX idx_tracked_channels_monitoring ON tracked_channels (user_id, is_monitoring) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_has_media ON messages (channel_id, has_media) WHERE has_media = TRUE;
CREATE INDEX idx_jobs_status ON jobs (status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_alert_rules_active ON alert_rules (user_id, is_active) WHERE is_active = TRUE;

-- =============================================================================
-- storage_usage trigger on media_files
-- =============================================================================
CREATE OR REPLACE FUNCTION update_storage_usage() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_downloaded = TRUE THEN
        INSERT INTO storage_usage (user_id, used_bytes, file_count)
            VALUES (NEW.user_id, COALESCE(NEW.file_size_bytes, 0), 1)
        ON CONFLICT (user_id) DO UPDATE
            SET used_bytes = storage_usage.used_bytes + COALESCE(NEW.file_size_bytes, 0),
                file_count = storage_usage.file_count + 1,
                updated_at = NOW();
    ELSIF TG_OP = 'DELETE' AND OLD.is_downloaded = TRUE THEN
        UPDATE storage_usage
            SET used_bytes = GREATEST(0, used_bytes - COALESCE(OLD.file_size_bytes, 0)),
                file_count = GREATEST(0, file_count - 1),
                updated_at = NOW()
        WHERE user_id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_storage_usage
    AFTER INSERT OR DELETE ON media_files
    FOR EACH ROW EXECUTE FUNCTION update_storage_usage();

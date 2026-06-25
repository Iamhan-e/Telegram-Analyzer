-- =============================================================================
-- Add DEFAULT gen_random_uuid() to every id UUID column
--
-- The initial migration omitted these defaults, so the live database has
-- bare "UUID NOT NULL" — requiring every INSERT to supply an id manually.
-- Fixing that here ensures all future rows get auto-generated UUIDs.
-- =============================================================================

ALTER TABLE users                   ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE subscriptions           ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE api_keys                ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tracked_channels        ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE channel_member_history  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE messages                ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE media_files             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE jobs                    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE alert_rules             ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE alert_events            ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE exports                 ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE channel_folders         ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE webhook_endpoints       ALTER COLUMN id SET DEFAULT gen_random_uuid();

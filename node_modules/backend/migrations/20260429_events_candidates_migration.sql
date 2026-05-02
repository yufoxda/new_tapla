-- Migration: 2026-04-29
-- Purpose: Add candidates_date / candidates_time and creator_display_name to events,
--          backfill candidates from event_candidates, and provide an optional drop.

BEGIN;

-- 1) Add new columns if they don't exist
ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS creator_display_name varchar(255);

ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS candidates_date json NOT NULL DEFAULT '[]'::json;

ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS candidates_time json NOT NULL DEFAULT '[]'::json;

-- 2) Backup existing event_candidates table (safe copy)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_candidates_backup') THEN
    CREATE TABLE event_candidates_backup (LIKE event_candidates INCLUDING ALL);
    INSERT INTO event_candidates_backup SELECT * FROM event_candidates;
  END IF;
END$$;

-- 3) Aggregate existing candidates into date/time arrays per event
--    We assume event_candidates.date is a timestamp (or timestamptz) column
WITH agg AS (
  SELECT
    event_id,
    ARRAY(SELECT DISTINCT to_char(date, 'YYYY-MM-DD') FROM event_candidates ec2 WHERE ec2.event_id = ec.event_id) AS dates,
    ARRAY(SELECT DISTINCT to_char(date, 'HH24:MI') FROM event_candidates ec3 WHERE ec3.event_id = ec.event_id) AS times
  FROM event_candidates ec
  GROUP BY event_id
)
UPDATE events e
SET candidates_date = to_json(agg.dates),
    candidates_time = to_json(agg.times)
FROM agg
WHERE e.id = agg.event_id;

-- 4) (Optional) Verify and then drop old table
-- DROP TABLE IF EXISTS event_candidates;
-- If you want to drop after verification, uncomment the line above and run again.

COMMIT;

-- Notes:
-- - This migration creates a backup table `event_candidates_backup` before modifying data.
-- - It does NOT populate `creator_display_name`; populate it from your users table or leave NULL.
-- - Run this with a DB user that has ALTER/INSERT/UPDATE privileges.
-- - To apply this on Neon/Postgres: use `psql` or your migration tool (drizzle-kit/sql migration runner).

--
-- 20260922_add_driver_tracker_type.sql
-- Adds the tracker brand field ("rastreador") collected in the new
-- step-by-step driver signup wizard. No existing column covered this.
--

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tracker_type text;

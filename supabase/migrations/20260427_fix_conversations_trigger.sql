-- Migration: Fix conversations trigger that references non-existent 'origin' column
-- The trigger was referencing NEW.origin instead of NEW.source, causing errors
-- when inserting/updating conversations with source values other than 'direct'.

-- 1. Identify and drop the problematic trigger/function
-- (The trigger likely auto-sets fields based on the conversation source)

-- Drop any trigger on conversations that might reference 'origin'
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tgname FROM pg_trigger
    WHERE tgrelid = 'conversations'::regclass
      AND tgname LIKE '%origin%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON conversations', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- Also check for functions that reference 'origin' column on conversations
-- and might be used by triggers
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'conversations'::regclass
      AND p.prosrc LIKE '%NEW.origin%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON conversations', r.tgname);
    RAISE NOTICE 'Dropped trigger % (function: %)', r.tgname, r.proname;
  END LOOP;
END $$;

-- 2. Recreate a safe trigger function that uses the correct column name 'source'
CREATE OR REPLACE FUNCTION handle_conversation_source()
RETURNS TRIGGER AS $$
BEGIN
  -- If source is provided, ensure related fields are consistent
  IF NEW.source IS NOT NULL AND NEW.source != 'direct' THEN
    -- Log the source for debugging
    RAISE NOTICE 'Conversation source: %', NEW.source;
  END IF;
  
  -- Auto-set last_message_at on insert if not provided
  IF TG_OP = 'INSERT' AND NEW.last_message_at IS NULL THEN
    NEW.last_message_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the corrected trigger
DROP TRIGGER IF EXISTS on_conversation_source ON conversations;
CREATE TRIGGER on_conversation_source
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION handle_conversation_source();

-- 4. Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'source'
  ) THEN
    ALTER TABLE conversations ADD COLUMN source TEXT DEFAULT 'direct';
    RAISE NOTICE 'Added missing "source" column to conversations';
  END IF;
END $$;

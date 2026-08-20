--
-- 20260820_add_admin_role.sql
-- Adds an admin flag to profiles so a user can be granted admin privileges
-- without changing their business user_type (caminhoneiro/transportadora/etc).
--

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Admins can view and update any profile (in addition to the existing
-- "Users can update own profile" policy for regular users).
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

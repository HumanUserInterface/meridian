-- Fix security issues flagged by Supabase linter

-- ============================================
-- Fix 1: update_updated_at_column function
-- Add explicit search_path to prevent search path injection
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- Fix 2: user_organizations view
-- Recreate without SECURITY DEFINER (use SECURITY INVOKER instead)
-- This ensures RLS policies of the querying user are respected
-- ============================================
DROP VIEW IF EXISTS user_organizations;

CREATE VIEW user_organizations
WITH (security_invoker = true)
AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.description,
  o.logo_url,
  o.plan,
  om.role,
  om.joined_at,
  o.created_at,
  (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id) as member_count
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid();

-- Update projects table to support organization ownership
-- Adds organization_id, visibility, and updated RLS policies

-- ============================================
-- Add new columns to projects
-- ============================================
ALTER TABLE projects
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public'));

-- Create index for organization queries
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_visibility ON projects(visibility);

-- ============================================
-- Helper function: Check if user has read access to project
-- ============================================
CREATE OR REPLACE FUNCTION user_has_project_access(project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  _project RECORD;
BEGIN
  SELECT user_id, organization_id, visibility INTO _project
  FROM projects WHERE id = project_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Owner always has access
  IF _project.user_id = auth.uid() THEN
    RETURN true;
  END IF;

  -- Public projects are accessible to all authenticated users
  IF _project.visibility = 'public' THEN
    RETURN true;
  END IF;

  -- Team projects are accessible to org members
  IF _project.organization_id IS NOT NULL AND _project.visibility = 'team' THEN
    RETURN is_org_member(_project.organization_id);
  END IF;

  -- Private org projects are accessible to org members
  IF _project.organization_id IS NOT NULL AND _project.visibility = 'private' THEN
    RETURN is_org_member(_project.organization_id);
  END IF;

  RETURN false;
END;
$$;

-- ============================================
-- Helper function: Check if user has write access to project
-- ============================================
CREATE OR REPLACE FUNCTION user_has_project_write_access(project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  _project RECORD;
  _role organization_role;
BEGIN
  SELECT user_id, organization_id, visibility INTO _project
  FROM projects WHERE id = project_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Owner always has write access
  IF _project.user_id = auth.uid() THEN
    RETURN true;
  END IF;

  -- For org projects, check if user is at least a member
  IF _project.organization_id IS NOT NULL THEN
    _role := get_user_org_role(_project.organization_id);
    -- Viewers can only read, members and above can write
    RETURN _role IN ('owner', 'admin', 'member');
  END IF;

  RETURN false;
END;
$$;

-- ============================================
-- Helper function: Check if user can delete project
-- ============================================
CREATE OR REPLACE FUNCTION user_can_delete_project(project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  _project RECORD;
  _role organization_role;
BEGIN
  SELECT user_id, organization_id INTO _project
  FROM projects WHERE id = project_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Owner always can delete
  IF _project.user_id = auth.uid() THEN
    RETURN true;
  END IF;

  -- For org projects, only admins and owners can delete
  IF _project.organization_id IS NOT NULL THEN
    _role := get_user_org_role(_project.organization_id);
    RETURN _role IN ('owner', 'admin');
  END IF;

  RETURN false;
END;
$$;

-- ============================================
-- Function to transfer project to organization
-- ============================================
CREATE OR REPLACE FUNCTION transfer_project_to_organization(
  p_project_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _project RECORD;
BEGIN
  -- Get project
  SELECT user_id, organization_id INTO _project
  FROM projects WHERE id = p_project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Only project owner can transfer
  IF _project.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the project owner can transfer the project';
  END IF;

  -- User must be admin/owner of target org
  IF NOT is_org_admin(p_org_id) THEN
    RAISE EXCEPTION 'You must be an admin of the target organization';
  END IF;

  -- Transfer the project
  UPDATE projects
  SET
    organization_id = p_org_id,
    visibility = 'team',
    updated_at = now()
  WHERE id = p_project_id;

  RETURN true;
END;
$$;

-- ============================================
-- Drop existing RLS policies for projects
-- ============================================
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- ============================================
-- New RLS Policies for projects
-- ============================================

-- Users can view projects they have access to
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_has_project_access(id));

-- Users can create personal projects or org projects if they're a member
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR is_org_member(organization_id)
    )
  );

-- Users can update projects they have write access to
CREATE POLICY "Users can update accessible projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_has_project_write_access(id));

-- Users can delete projects they're allowed to delete
CREATE POLICY "Users can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_can_delete_project(id));

-- ============================================
-- Drop existing RLS policies for nodes
-- ============================================
DROP POLICY IF EXISTS "Users can view nodes in their projects" ON nodes;
DROP POLICY IF EXISTS "Users can create nodes in their projects" ON nodes;
DROP POLICY IF EXISTS "Users can update nodes in their projects" ON nodes;
DROP POLICY IF EXISTS "Users can delete nodes in their projects" ON nodes;

-- ============================================
-- New RLS Policies for nodes
-- ============================================

CREATE POLICY "Users can view nodes in accessible projects"
  ON nodes FOR SELECT
  TO authenticated
  USING (user_has_project_access(project_id));

CREATE POLICY "Users can create nodes in writable projects"
  ON nodes FOR INSERT
  TO authenticated
  WITH CHECK (user_has_project_write_access(project_id));

CREATE POLICY "Users can update nodes in writable projects"
  ON nodes FOR UPDATE
  TO authenticated
  USING (user_has_project_write_access(project_id));

CREATE POLICY "Users can delete nodes in writable projects"
  ON nodes FOR DELETE
  TO authenticated
  USING (user_has_project_write_access(project_id));

-- ============================================
-- Drop existing RLS policies for edges
-- ============================================
DROP POLICY IF EXISTS "Users can view edges in their projects" ON edges;
DROP POLICY IF EXISTS "Users can create edges in their projects" ON edges;
DROP POLICY IF EXISTS "Users can update edges in their projects" ON edges;
DROP POLICY IF EXISTS "Users can delete edges in their projects" ON edges;

-- ============================================
-- New RLS Policies for edges
-- ============================================

CREATE POLICY "Users can view edges in accessible projects"
  ON edges FOR SELECT
  TO authenticated
  USING (user_has_project_access(project_id));

CREATE POLICY "Users can create edges in writable projects"
  ON edges FOR INSERT
  TO authenticated
  WITH CHECK (user_has_project_write_access(project_id));

CREATE POLICY "Users can update edges in writable projects"
  ON edges FOR UPDATE
  TO authenticated
  USING (user_has_project_write_access(project_id));

CREATE POLICY "Users can delete edges in writable projects"
  ON edges FOR DELETE
  TO authenticated
  USING (user_has_project_write_access(project_id));

-- ============================================
-- Drop existing RLS policies for keywords
-- ============================================
DROP POLICY IF EXISTS "Users can view keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Users can create keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Users can update keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Users can delete keywords in their projects" ON keywords;

-- ============================================
-- New RLS Policies for keywords
-- ============================================

CREATE POLICY "Users can view keywords in accessible projects"
  ON keywords FOR SELECT
  TO authenticated
  USING (user_has_project_access(project_id));

CREATE POLICY "Users can create keywords in writable projects"
  ON keywords FOR INSERT
  TO authenticated
  WITH CHECK (user_has_project_write_access(project_id));

CREATE POLICY "Users can update keywords in writable projects"
  ON keywords FOR UPDATE
  TO authenticated
  USING (user_has_project_write_access(project_id));

CREATE POLICY "Users can delete keywords in writable projects"
  ON keywords FOR DELETE
  TO authenticated
  USING (user_has_project_write_access(project_id));

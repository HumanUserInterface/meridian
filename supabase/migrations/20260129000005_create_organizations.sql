-- Create organization-related tables
-- Organizations, members, and invitations for team collaboration

-- Create organization_role enum type
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create invitation_status enum type
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');

-- ============================================
-- Organizations table
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,

  -- Organization settings
  settings JSONB DEFAULT '{
    "defaultMemberRole": "member",
    "allowMemberInvites": false,
    "features": {
      "projectSharing": true,
      "teamComments": true,
      "analytics": false
    }
  }'::jsonb,

  -- Billing
  billing_email TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- Organization members table
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',

  -- Custom permissions override (optional)
  custom_permissions JSONB,

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, user_id)
);

-- ============================================
-- Organization invitations table
-- ============================================
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',

  -- Invitation details
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  status invitation_status DEFAULT 'pending' NOT NULL,

  -- Expiration (default 7 days)
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days') NOT NULL,

  -- Optional personal message
  message TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status);

-- GIN indexes for JSONB
CREATE INDEX idx_organizations_settings ON organizations USING GIN (settings);
CREATE INDEX idx_org_members_permissions ON organization_members USING GIN (custom_permissions);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: Get user's role in an organization
-- ============================================
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, uid UUID DEFAULT auth.uid())
RETURNS organization_role
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM organization_members
    WHERE organization_id = org_id AND user_id = uid
  );
END;
$$;

-- ============================================
-- Helper function: Check if user is org member
-- ============================================
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = uid
  );
END;
$$;

-- ============================================
-- Helper function: Check if user is org admin or owner
-- ============================================
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = uid
    AND role IN ('owner', 'admin')
  );
END;
$$;

-- ============================================
-- RLS Policies for organizations
-- ============================================

-- Members can view their organizations
CREATE POLICY "Members can view organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_org_member(id));

-- Only authenticated users can create organizations
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only owners/admins can update organization
CREATE POLICY "Admins can update organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (is_org_admin(id));

-- Only owners can delete organization
CREATE POLICY "Owners can delete organization"
  ON organizations FOR DELETE
  TO authenticated
  USING (get_user_org_role(id) = 'owner');

-- ============================================
-- RLS Policies for organization_members
-- ============================================

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (is_org_member(organization_id));

-- Admins can add members
CREATE POLICY "Admins can add members"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(organization_id));

-- Admins can update members (except owners can't be demoted by admins)
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (
    is_org_admin(organization_id)
    AND (
      -- Owners can update anyone
      get_user_org_role(organization_id) = 'owner'
      -- Admins can update non-owners
      OR role != 'owner'
    )
  );

-- Admins can remove members (except owners can't be removed by admins)
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (
    is_org_admin(organization_id)
    AND (
      get_user_org_role(organization_id) = 'owner'
      OR role != 'owner'
    )
  );

-- Users can leave organizations (remove themselves)
CREATE POLICY "Users can leave organization"
  ON organization_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND role != 'owner');

-- ============================================
-- RLS Policies for organization_invitations
-- ============================================

-- Admins can view invitations
CREATE POLICY "Admins can view invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (is_org_admin(organization_id));

-- Users can view invitations sent to their email
CREATE POLICY "Users can view their invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_org_admin(organization_id)
    AND invited_by = auth.uid()
  );

-- Admins can update invitations (revoke)
CREATE POLICY "Admins can update invitations"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (is_org_admin(organization_id));

-- Invitees can update their own invitation (accept/decline)
CREATE POLICY "Invitees can respond to invitation"
  ON organization_invitations FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
    AND expires_at > now()
  );

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_invitations_updated_at
  BEFORE UPDATE ON organization_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to create an organization
-- ============================================
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _user_id UUID := auth.uid();
BEGIN
  -- Validate slug format
  IF org_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.';
  END IF;

  -- Create the organization
  INSERT INTO organizations (name, slug, description, created_by)
  VALUES (org_name, org_slug, org_description, _user_id)
  RETURNING id INTO _org_id;

  -- Add creator as owner
  INSERT INTO organization_members (organization_id, user_id, role, joined_at)
  VALUES (_org_id, _user_id, 'owner', now());

  RETURN _org_id;
END;
$$;

-- ============================================
-- Function to accept an organization invitation
-- ============================================
CREATE OR REPLACE FUNCTION accept_organization_invitation(invitation_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
  _user_id UUID := auth.uid();
  _user_email TEXT;
BEGIN
  -- Get user's email
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  -- Get and validate invitation
  SELECT * INTO _invitation
  FROM organization_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  IF _invitation.email != _user_email THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = _invitation.organization_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this organization';
  END IF;

  -- Add user as member
  INSERT INTO organization_members (
    organization_id, user_id, role, invited_by, invited_at, joined_at
  )
  VALUES (
    _invitation.organization_id,
    _user_id,
    _invitation.role,
    _invitation.invited_by,
    _invitation.created_at,
    now()
  );

  -- Update invitation status
  UPDATE organization_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = _invitation.id;

  RETURN _invitation.organization_id;
END;
$$;

-- ============================================
-- View: User's organizations with role
-- ============================================
CREATE VIEW user_organizations AS
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

-- Create onboarding_progress table
-- Tracks user onboarding steps, feature discovery, and analytics

CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Overall completion status
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Onboarding steps tracking
  steps JSONB DEFAULT '{
    "welcome": {"completed": false, "completedAt": null},
    "createFirstProject": {"completed": false, "completedAt": null},
    "addFirstNode": {"completed": false, "completedAt": null},
    "addFirstEdge": {"completed": false, "completedAt": null},
    "exploreAnalysis": {"completed": false, "completedAt": null},
    "exportProject": {"completed": false, "completedAt": null},
    "customizeSettings": {"completed": false, "completedAt": null}
  }'::jsonb,

  -- Feature discovery (tracks first-time usage)
  feature_discovery JSONB DEFAULT '{
    "canvas": {"discovered": false, "discoveredAt": null},
    "nodeCreation": {"discovered": false, "discoveredAt": null},
    "edgeCreation": {"discovered": false, "discoveredAt": null},
    "leftPanel": {"discovered": false, "discoveredAt": null},
    "rightPanel": {"discovered": false, "discoveredAt": null},
    "nodeProperties": {"discovered": false, "discoveredAt": null},
    "analysisPanel": {"discovered": false, "discoveredAt": null},
    "exportCsv": {"discovered": false, "discoveredAt": null},
    "exportSitemap": {"discovered": false, "discoveredAt": null},
    "keyboardShortcuts": {"discovered": false, "discoveredAt": null},
    "minimap": {"discovered": false, "discoveredAt": null},
    "multiSelect": {"discovered": false, "discoveredAt": null}
  }'::jsonb,

  -- Dismissed UI hints
  dismissed_hints JSONB DEFAULT '[]'::jsonb,

  -- Completed product tours
  tours_completed JSONB DEFAULT '{
    "mainTour": false,
    "canvasTour": false,
    "analysisTour": false,
    "exportTour": false
  }'::jsonb,

  -- NPS/Feedback
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  nps_submitted_at TIMESTAMPTZ,

  -- Signup tracking
  signup_source TEXT,
  referrer_url TEXT,
  initial_utm_params JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_onboarding_user_id ON onboarding_progress(user_id);
CREATE INDEX idx_onboarding_is_complete ON onboarding_progress(is_complete);
CREATE INDEX idx_onboarding_signup_source ON onboarding_progress(signup_source);

-- GIN indexes for JSONB queries
CREATE INDEX idx_onboarding_steps ON onboarding_progress USING GIN (steps);
CREATE INDEX idx_onboarding_features ON onboarding_progress USING GIN (feature_discovery);
CREATE INDEX idx_onboarding_utm ON onboarding_progress USING GIN (initial_utm_params);

-- Enable Row Level Security
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own onboarding data
CREATE POLICY "Users can view their own onboarding"
  ON onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding"
  ON onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
  ON onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_updated_at
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to complete an onboarding step
CREATE OR REPLACE FUNCTION complete_onboarding_step(step_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _result JSONB;
BEGIN
  UPDATE onboarding_progress
  SET
    steps = jsonb_set(
      steps,
      ARRAY[step_name],
      jsonb_build_object('completed', true, 'completedAt', now())
    ),
    updated_at = now()
  WHERE user_id = auth.uid()
  RETURNING steps INTO _result;

  -- Check if all steps are complete
  IF NOT EXISTS (
    SELECT 1 FROM onboarding_progress
    WHERE user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM jsonb_each(steps) AS s
      WHERE NOT (s.value->>'completed')::boolean
    )
  ) THEN
    UPDATE onboarding_progress
    SET is_complete = true, completed_at = now()
    WHERE user_id = auth.uid();
  END IF;

  RETURN _result;
END;
$$;

-- Helper function to track feature discovery
CREATE OR REPLACE FUNCTION track_feature_discovery(feature_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _result JSONB;
  _current JSONB;
BEGIN
  -- Get current feature status
  SELECT feature_discovery->feature_name INTO _current
  FROM onboarding_progress
  WHERE user_id = auth.uid();

  -- Only update if not already discovered
  IF _current IS NULL OR NOT (_current->>'discovered')::boolean THEN
    UPDATE onboarding_progress
    SET
      feature_discovery = jsonb_set(
        feature_discovery,
        ARRAY[feature_name],
        jsonb_build_object('discovered', true, 'discoveredAt', now())
      ),
      updated_at = now()
    WHERE user_id = auth.uid()
    RETURNING feature_discovery INTO _result;
  ELSE
    _result := (SELECT feature_discovery FROM onboarding_progress WHERE user_id = auth.uid());
  END IF;

  RETURN _result;
END;
$$;

-- Update handle_new_user function to also create onboarding record
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _display_name TEXT;
  _utm_params JSONB;
BEGIN
  -- Extract display name from OAuth metadata or use email prefix
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract UTM params if available
  _utm_params := COALESCE(
    NEW.raw_user_meta_data->'utm_params',
    '{}'::jsonb
  );

  -- Create profile
  INSERT INTO profiles (id, display_name, email_verified)
  VALUES (
    NEW.id,
    _display_name,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );

  -- Create user settings with defaults
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  -- Create onboarding progress with UTM tracking
  INSERT INTO onboarding_progress (
    user_id,
    signup_source,
    referrer_url,
    initial_utm_params
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'signup_source',
    NEW.raw_user_meta_data->>'referrer_url',
    _utm_params
  );

  RETURN NEW;
END;
$$;

-- Backfill existing users who don't have onboarding records
INSERT INTO onboarding_progress (user_id, created_at)
SELECT id, created_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM onboarding_progress)
ON CONFLICT (user_id) DO NOTHING;

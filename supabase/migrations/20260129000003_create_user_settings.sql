-- Create user_settings table
-- Stores user preferences, theme, editor settings, notifications, etc.

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Appearance
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  accent_color TEXT DEFAULT '#3b82f6',
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),

  -- Editor settings
  editor_settings JSONB DEFAULT '{
    "autoSave": true,
    "autoSaveInterval": 30,
    "showMinimap": true,
    "showGrid": true,
    "snapToGrid": false,
    "gridSize": 20,
    "defaultNodeType": "cluster",
    "showNodeLabels": true,
    "animateEdges": true
  }'::jsonb,

  -- Notification preferences
  notifications JSONB DEFAULT '{
    "email": {
      "enabled": true,
      "projectUpdates": true,
      "teamInvites": true,
      "weeklyDigest": true,
      "marketing": false
    },
    "inApp": {
      "enabled": true,
      "projectUpdates": true,
      "teamActivity": true,
      "mentions": true
    },
    "digestFrequency": "weekly"
  }'::jsonb,

  -- Default project settings (applied to new projects)
  default_project_settings JSONB DEFAULT '{
    "defaultNodeType": "cluster",
    "autoSave": true,
    "showMinimap": true,
    "snapToGrid": false,
    "gridSize": 20,
    "theme": "system"
  }'::jsonb,

  -- Keyboard shortcuts (customizable)
  keyboard_shortcuts JSONB DEFAULT '{
    "toggleLeftPanel": "[",
    "toggleRightPanel": "]",
    "deleteSelected": "Delete",
    "undo": "mod+z",
    "redo": "mod+shift+z",
    "save": "mod+s",
    "search": "mod+k",
    "newNode": "n",
    "fitView": "f"
  }'::jsonb,

  -- AI settings
  ai_settings JSONB DEFAULT '{
    "suggestionsEnabled": true,
    "autoGenerateMeta": false,
    "tone": "professional",
    "creativity": 0.7
  }'::jsonb,

  -- Localization
  language TEXT DEFAULT 'en',
  locale TEXT DEFAULT 'en-US',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'YYYY-MM-DD',

  -- Privacy
  analytics_opt_in BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_theme ON user_settings(theme);

-- GIN indexes for JSONB columns (efficient queries on nested properties)
CREATE INDEX idx_user_settings_editor ON user_settings USING GIN (editor_settings);
CREATE INDEX idx_user_settings_notifications ON user_settings USING GIN (notifications);
CREATE INDEX idx_user_settings_keyboard ON user_settings USING GIN (keyboard_shortcuts);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update handle_new_user function to also create settings
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _display_name TEXT;
BEGIN
  -- Extract display name from OAuth metadata or use email prefix
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
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

  RETURN NEW;
END;
$$;

-- Backfill existing users who don't have settings
INSERT INTO user_settings (user_id, created_at)
SELECT id, created_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

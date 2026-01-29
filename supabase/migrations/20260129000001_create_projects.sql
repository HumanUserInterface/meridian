-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  settings JSONB DEFAULT '{"autoSave": true, "showMinimap": true, "snapToGrid": false, "gridSize": 20, "defaultNodeType": "cluster", "theme": "system"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create nodes table
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  -- React Flow position
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  -- Node data
  node_type TEXT NOT NULL DEFAULT 'cluster',
  title TEXT NOT NULL,
  slug TEXT,
  url TEXT,
  primary_keyword TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  search_intent TEXT DEFAULT 'informational',
  status TEXT DEFAULT 'planned',
  word_count_target INTEGER,
  word_count_actual INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  assignee TEXT,
  due_date DATE,
  published_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create edges table
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  source_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  -- Edge data
  link_type TEXT DEFAULT 'contextual',
  anchor_text TEXT,
  position TEXT,
  nofollow BOOLEAN DEFAULT false,
  is_planned BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create keywords table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  volume INTEGER,
  difficulty INTEGER,
  intent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_nodes_project_id ON nodes(project_id);
CREATE INDEX idx_edges_project_id ON edges(project_id);
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);
CREATE INDEX idx_keywords_project_id ON keywords(project_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for nodes (via project ownership)
CREATE POLICY "Users can view nodes in their projects"
  ON nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = nodes.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create nodes in their projects"
  ON nodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = nodes.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update nodes in their projects"
  ON nodes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = nodes.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete nodes in their projects"
  ON nodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = nodes.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for edges (via project ownership)
CREATE POLICY "Users can view edges in their projects"
  ON edges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = edges.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create edges in their projects"
  ON edges FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = edges.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update edges in their projects"
  ON edges FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = edges.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete edges in their projects"
  ON edges FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = edges.project_id AND projects.user_id = auth.uid()
  ));

-- RLS Policies for keywords (via project ownership)
CREATE POLICY "Users can view keywords in their projects"
  ON keywords FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = keywords.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create keywords in their projects"
  ON keywords FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = keywords.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update keywords in their projects"
  ON keywords FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = keywords.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete keywords in their projects"
  ON keywords FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = keywords.project_id AND projects.user_id = auth.uid()
  ));

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_edges_updated_at
  BEFORE UPDATE ON edges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

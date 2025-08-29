-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  participants TEXT[] DEFAULT '{}',
  transcript TEXT,
  minutes_html TEXT,
  minutes_json JSONB,
  minutes_table JSONB,
  ai_meta JSONB,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create meeting versions table for history
CREATE TABLE public.meeting_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  label TEXT,
  minutes_html TEXT,
  minutes_json JSONB,
  minutes_table JSONB,
  transcript TEXT,
  diff_meta JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shares table for sharing functionality
CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'token')),
  action TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, meeting_id)
);

-- Enable Row Level Security
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings
CREATE POLICY "Users can view their own meetings or shared meetings" ON public.meetings
  FOR SELECT USING (
    auth.uid() = owner 
    OR deleted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.shares 
      WHERE shares.meeting_id = meetings.id 
      AND shares.expires_at > now()
    )
  );

CREATE POLICY "Users can create their own meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own meetings or shared editable meetings" ON public.meetings
  FOR UPDATE USING (
    auth.uid() = owner 
    OR EXISTS (
      SELECT 1 FROM public.shares 
      WHERE shares.meeting_id = meetings.id 
      AND shares.role = 'editor'
      AND shares.expires_at > now()
    )
  );

CREATE POLICY "Users can delete their own meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = owner);

-- Create policies for meeting versions
CREATE POLICY "Users can view versions of accessible meetings" ON public.meeting_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_versions.meeting_id
      AND (
        meetings.owner = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shares 
          WHERE shares.meeting_id = meetings.id 
          AND shares.expires_at > now()
        )
      )
    )
  );

CREATE POLICY "Users can create versions for editable meetings" ON public.meeting_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_versions.meeting_id
      AND (
        meetings.owner = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shares 
          WHERE shares.meeting_id = meetings.id 
          AND shares.role = 'editor'
          AND shares.expires_at > now()
        )
      )
    )
  );

-- Create policies for shares
CREATE POLICY "Users can view shares for their meetings" ON public.shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = shares.meeting_id 
      AND meetings.owner = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their meetings" ON public.shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = shares.meeting_id 
      AND meetings.owner = auth.uid()
    )
  );

-- Create policies for activity log
CREATE POLICY "Users can view activity for accessible meetings" ON public.activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = activity_log.meeting_id
      AND (
        meetings.owner = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.shares 
          WHERE shares.meeting_id = meetings.id 
          AND shares.expires_at > now()
        )
      )
    )
  );

CREATE POLICY "Users can create activity logs" ON public.activity_log
  FOR INSERT WITH CHECK (true);

-- Create policies for favorites
CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_meetings_owner ON public.meetings(owner);
CREATE INDEX idx_meetings_updated_at ON public.meetings(updated_at DESC);
CREATE INDEX idx_meetings_deleted_at ON public.meetings(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_meeting_versions_meeting_id_version ON public.meeting_versions(meeting_id, version DESC);
CREATE INDEX idx_shares_token ON public.shares(token);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at) WHERE expires_at > now();
CREATE INDEX idx_activity_log_meeting_id_created_at ON public.activity_log(meeting_id, created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
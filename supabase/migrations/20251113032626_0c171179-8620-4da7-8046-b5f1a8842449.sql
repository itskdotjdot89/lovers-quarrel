-- Create table for user responses to cards
CREATE TABLE public.card_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  response_text TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('text', 'audio')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI analyses
CREATE TABLE public.ai_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.card_responses(id) ON DELETE CASCADE,
  analysis_text TEXT NOT NULL,
  sentiment TEXT,
  key_themes TEXT[],
  psychological_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_responses
CREATE POLICY "Users can view their own responses"
  ON public.card_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responses"
  ON public.card_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.card_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.card_responses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_analyses
CREATE POLICY "Users can view analyses of their responses"
  ON public.ai_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.card_responses
      WHERE card_responses.id = ai_analyses.response_id
      AND card_responses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analyses for their responses"
  ON public.ai_analyses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.card_responses
      WHERE card_responses.id = response_id
      AND card_responses.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_card_responses_user_id ON public.card_responses(user_id);
CREATE INDEX idx_card_responses_card_id ON public.card_responses(card_id);
CREATE INDEX idx_ai_analyses_response_id ON public.ai_analyses(response_id);
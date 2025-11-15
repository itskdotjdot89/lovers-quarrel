-- Create game_sessions table for shared multiplayer sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  deck_ids TEXT[] NOT NULL,
  subtypes TEXT[] NOT NULL,
  spice_level TEXT NOT NULL,
  current_card_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session_participants table
CREATE TABLE public.session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create session_cards table
CREATE TABLE public.session_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, card_order)
);

-- Create session_responses table
CREATE TABLE public.session_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL,
  response_text TEXT,
  choice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, card_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions
CREATE POLICY "Users can view sessions they participate in"
  ON public.game_sessions FOR SELECT
  USING (
    auth.uid() = host_id OR
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_id = game_sessions.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their sessions"
  ON public.game_sessions FOR UPDATE
  USING (auth.uid() = host_id);

-- RLS Policies for session_participants
CREATE POLICY "Users can view participants in their sessions"
  ON public.session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE id = session_participants.session_id
      AND (host_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.session_participants sp
        WHERE sp.session_id = game_sessions.id AND sp.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join sessions"
  ON public.session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for session_cards
CREATE POLICY "Users can view cards in their sessions"
  ON public.session_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE id = session_cards.session_id
      AND (host_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.session_participants
        WHERE session_id = game_sessions.id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Hosts can insert cards"
  ON public.session_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE id = session_cards.session_id AND host_id = auth.uid()
    )
  );

-- RLS Policies for session_responses
CREATE POLICY "Users can view responses in their sessions"
  ON public.session_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE id = session_responses.session_id
      AND (host_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.session_participants
        WHERE session_id = game_sessions.id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can create their own responses"
  ON public.session_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_responses;
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view sessions they participate in" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON public.session_participants;

-- Create security definer function to check session participation
CREATE OR REPLACE FUNCTION public.is_session_participant(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.session_participants
    WHERE user_id = _user_id
      AND session_id = _session_id
  )
$$;

-- Recreate game_sessions SELECT policy using the function
CREATE POLICY "Users can view sessions they participate in"
  ON public.game_sessions FOR SELECT
  USING (
    auth.uid() = host_id OR
    public.is_session_participant(auth.uid(), id)
  );

-- Recreate session_participants SELECT policy using the function
CREATE POLICY "Users can view participants in their sessions"
  ON public.session_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE id = session_participants.session_id
      AND (host_id = auth.uid() OR public.is_session_participant(auth.uid(), id))
    )
  );
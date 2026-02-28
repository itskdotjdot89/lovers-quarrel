
-- Fix session_responses SELECT policy to use is_session_participant function (breaks circular dependency)
DROP POLICY IF EXISTS "Users can view responses in their sessions" ON public.session_responses;
CREATE POLICY "Users can view responses in their sessions"
ON public.session_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_sessions
    WHERE game_sessions.id = session_responses.session_id
    AND (
      game_sessions.host_id = auth.uid()
      OR is_session_participant(auth.uid(), game_sessions.id)
    )
  )
);

-- Fix session_cards SELECT policy similarly
DROP POLICY IF EXISTS "Users can view cards in their sessions" ON public.session_cards;
CREATE POLICY "Users can view cards in their sessions"
ON public.session_cards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_sessions
    WHERE game_sessions.id = session_cards.session_id
    AND (
      game_sessions.host_id = auth.uid()
      OR is_session_participant(auth.uid(), game_sessions.id)
    )
  )
);

-- Add policy to allow users to view waiting sessions by session code
-- This enables the join flow where users need to see a session before they can join it
CREATE POLICY "Users can view waiting sessions by code"
ON public.game_sessions
FOR SELECT
USING (status = 'waiting');
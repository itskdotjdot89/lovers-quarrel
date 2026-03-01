-- Add DELETE policy on game_sessions for host
CREATE POLICY "Hosts can delete their sessions"
ON public.game_sessions
FOR DELETE
USING (auth.uid() = host_id);
-- Allow public viewing of user tokens for leaderboard
CREATE POLICY "Anyone can view user tokens for leaderboard"
ON public.user_tokens
FOR SELECT
USING (true);

-- Allow public viewing of game sessions for leaderboard stats
CREATE POLICY "Anyone can view game sessions for leaderboard"
ON public.game_sessions
FOR SELECT
USING (true);
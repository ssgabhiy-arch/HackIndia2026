-- Insert all game modes into the games table
INSERT INTO public.games (name, description, icon) VALUES
  ('AI Adaptive Quiz', 'Test your knowledge with dynamically adjusting difficulty', '🧠'),
  ('Memory Match', 'Match programming concepts', '🎯'),
  ('Code Debug', 'Find and fix bugs in code snippets', '🐛'),
  ('Algorithm Race', 'Solve algorithmic challenges against the clock', '⚡')
ON CONFLICT DO NOTHING;
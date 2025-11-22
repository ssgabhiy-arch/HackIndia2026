-- Add quiz game tracking fields to game_sessions
ALTER TABLE public.game_sessions 
ADD COLUMN IF NOT EXISTS difficulty integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS accuracy numeric(5,2),
ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_response_time numeric(10,2);

-- Create transactions table for wallet history
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL,
  game_session_id uuid REFERENCES game_sessions(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions"
ON public.wallet_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.wallet_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS public.game_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  insights jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_insights
CREATE POLICY "Users can view own insights"
ON public.game_insights
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
ON public.game_insights
FOR INSERT
WITH CHECK (auth.uid() = user_id);
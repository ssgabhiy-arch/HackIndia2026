import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const rawBody = await req.json();
    const {
      gameId,
      score,
      accuracy,
      streak,
      totalTime,
      difficulty,
      questionsAnswered,
    } = rawBody ?? {};

    // Validate required inputs (gameId and score). Other fields are optional and defaulted.
    if (!gameId || score === undefined) {
      console.error('Missing required fields in submit-quiz-session body:', rawBody);
      throw new Error('Missing required fields');
    }

    const safeAccuracy = typeof accuracy === 'number' && !Number.isNaN(accuracy) ? accuracy : 0;
    const safeStreak = typeof streak === 'number' && !Number.isNaN(streak) ? streak : 0;
    const safeTotalTime = typeof totalTime === 'number' && !Number.isNaN(totalTime) ? totalTime : 0;
    const safeDifficulty = typeof difficulty === 'number' && !Number.isNaN(difficulty) ? difficulty : 1;
    const safeQuestionsAnswered = typeof questionsAnswered === 'number' && !Number.isNaN(questionsAnswered)
      ? questionsAnswered
      : 0;

    // Calculate token reward: base + accuracy bonus + streak bonus + speed bonus
    // Formula: reward = 3 + (accuracy * 2) + (streak * 1.5) + speed bonus
    const baseReward = 3;
    const accuracyBonus = (safeAccuracy / 100) * 2;
    const streakBonus = Math.min(safeStreak, 10) * 1.5; // Cap streak bonus at 10
    
    // Speed bonus: reward faster completion (max 5 bonus tokens)
    // For 5 questions, ideal time ~30s, max time before no bonus ~90s
    const idealTime = 30;
    const maxTimeForBonus = 90;
    let speedBonus = 0;
    if (safeTotalTime > 0 && safeTotalTime <= maxTimeForBonus) {
      speedBonus = Math.max(0, 5 * (1 - (safeTotalTime - idealTime) / (maxTimeForBonus - idealTime)));
    }
    
    const tokensEarned = Math.round(baseReward + accuracyBonus + streakBonus + speedBonus);

    // Insert game session
    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_id: gameId,
        score: score,
        tokens_earned: tokensEarned,
        difficulty: safeDifficulty,
        accuracy: safeAccuracy,
        streak: safeStreak,
        avg_response_time: safeTotalTime
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      throw sessionError;
    }

    // Add tokens to user using the RPC function
    const { error: tokenError } = await supabase.rpc('add_tokens_to_user', {
      p_user_id: user.id,
      p_tokens: tokensEarned
    });

    if (tokenError) {
      console.error('Token add error:', tokenError);
      throw tokenError;
    }

    // Create wallet transaction
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: tokensEarned,
        transaction_type: 'game_reward',
        game_session_id: sessionData.id
      });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
    }

    // Get updated token balance
    const { data: tokenData } = await supabase
      .from('user_tokens')
      .select('total_tokens')
      .eq('user_id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: sessionData.id,
        tokensEarned,
        newBalance: tokenData?.total_tokens || 0,
        score,
        accuracy,
        streak
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in submit-quiz-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract JWT token from Authorization header
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

    // Pass token explicitly to getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { gameId, startTime, endTime } = await req.json();

    // Validate input
    if (!gameId || !startTime || !endTime) {
      throw new Error('Missing required fields');
    }

    // Calculate reaction time
    const reactionTime = endTime - startTime;

    // Validate reaction time is reasonable (between 100ms and 10000ms)
    if (reactionTime < 100 || reactionTime > 10000) {
      throw new Error('Invalid reaction time');
    }

    // Calculate tokens based on performance (server-side)
    const tokens = Math.max(1, Math.floor(1000 / reactionTime * 10));

    // Insert game session
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_id: gameId,
        score: reactionTime,
        tokens_earned: tokens,
      });

    if (sessionError) {
      console.error('Error inserting game session:', sessionError);
      throw new Error('Failed to save game session');
    }

    // Update user tokens
    const { error: tokensError } = await supabase.rpc('add_tokens_to_user', {
      p_user_id: user.id,
      p_tokens: tokens,
    });

    if (tokensError) {
      console.error('Error updating tokens:', tokensError);
      throw new Error('Failed to update tokens');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reactionTime, 
        tokensEarned: tokens 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in submit-game-session:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

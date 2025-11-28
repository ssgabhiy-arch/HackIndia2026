import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { accuracy, streak, avgTime, currentDifficulty } = await req.json();

    let newDifficulty = currentDifficulty || 1;

    // Increase difficulty on high accuracy and good streak
    if (accuracy > 80 && streak >= 3) {
      newDifficulty = Math.min(10, newDifficulty + 1);
    } else if (accuracy > 90 && streak >= 5) {
      newDifficulty = Math.min(10, newDifficulty + 2);
    }
    // Decrease difficulty on low accuracy
    else if (accuracy < 50) {
      newDifficulty = Math.max(1, newDifficulty - 1);
    } else if (accuracy < 30) {
      newDifficulty = Math.max(1, newDifficulty - 2);
    }

    // Adjust based on average response time (faster = can handle harder)
    if (avgTime && avgTime < 5 && accuracy > 70) {
      newDifficulty = Math.min(10, newDifficulty + 1);
    }

    return new Response(
      JSON.stringify({
        newDifficulty: Math.round(newDifficulty),
        adjustment: newDifficulty - currentDifficulty
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in adjust-difficulty:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
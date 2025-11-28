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

    const { userCode, correctCode, difficulty } = await req.json();

    // Normalize code for comparison (remove whitespace differences)
    const normalizeCode = (code: string) => {
      return code.replace(/\s+/g, ' ').trim().toLowerCase();
    };

    const normalizedUser = normalizeCode(userCode);
    const normalizedCorrect = normalizeCode(correctCode);

    // Check if code is essentially the same
    const isCorrect = normalizedUser === normalizedCorrect;

    let feedback = "";
    if (isCorrect) {
      feedback = "Perfect! You've successfully fixed the bug.";
    } else {
      // Use AI to provide helpful feedback
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'user',
                  content: `User's code:\n${userCode}\n\nCorrect code:\n${correctCode}\n\nProvide a brief hint (max 2 sentences) about what's still wrong without giving away the answer.`
                }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            feedback = aiData.choices?.[0]?.message?.content || "Not quite right. Compare your solution carefully.";
          } else {
            feedback = "Not quite right. Check your solution carefully.";
          }
        } catch {
          feedback = "Not quite right. Review the bug description and try again.";
        }
      } else {
        feedback = "Not quite right. Review your solution and try again.";
      }
    }

    return new Response(
      JSON.stringify({
        isCorrect,
        feedback,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-debug-solution:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
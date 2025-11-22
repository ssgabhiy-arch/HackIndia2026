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

    const { difficulty } = await req.json();
    const difficultyLevel = Math.max(1, Math.min(10, difficulty || 1));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            role: 'system',
            content: 'You generate code debugging challenges for JavaScript/TypeScript.'
          },
          {
            role: 'user',
            content: `Generate a code debugging challenge with difficulty ${difficultyLevel} (1=easy, 10=expert). Focus on common programming bugs like missing arguments, type errors, logic errors, or syntax mistakes.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_debug_challenge',
              description: 'Generate a code debugging challenge with buggy code and fixed code',
              parameters: {
                type: 'object',
                properties: {
                  buggyCode: {
                    type: 'string',
                    description: 'The buggy code snippet that contains an error'
                  },
                  fixedCode: {
                    type: 'string',
                    description: 'The corrected version of the code'
                  },
                  description: {
                    type: 'string',
                    description: 'A brief explanation of what the bug is and how to fix it'
                  }
                },
                required: ['buggyCode', 'fixedCode', 'description'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_debug_challenge' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in AI response:', JSON.stringify(aiData));
      throw new Error('No tool call from AI');
    }

    let challengeData;
    try {
      challengeData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({
        buggyCode: challengeData.buggyCode,
        fixedCode: challengeData.fixedCode,
        description: challengeData.description,
        difficulty: difficultyLevel
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-debug-challenge:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
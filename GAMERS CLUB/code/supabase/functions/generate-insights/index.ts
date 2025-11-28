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

    const { score, accuracy, streak, avgTime, questionsAnswered } = await req.json();

    // Call Lovable AI to generate personalized insights
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
            content: 'You are an AI coach analyzing quiz performance. Generate 3 concise, encouraging insights based on player stats. Return ONLY a valid JSON array of strings with no markdown formatting.'
          },
          {
            role: 'user',
            content: `Analyze this quiz performance:
- Score: ${score}
- Accuracy: ${accuracy}%
- Streak: ${streak}
- Average Time: ${avgTime}s
- Questions Answered: ${questionsAnswered}

Generate 3 short, motivational insights (max 15 words each) as a JSON array of strings.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Fallback insights
      return new Response(
        JSON.stringify({
          insights: [
            `Great job! You scored ${score} points.`,
            `Your accuracy of ${accuracy}% shows good understanding.`,
            streak > 3 ? `Amazing ${streak} question streak!` : `Keep practicing to build your streak!`
          ]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content from AI');
    }

    let insights;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI insights:', content);
      insights = [
        `You scored ${score} points - great work!`,
        `${accuracy}% accuracy demonstrates solid knowledge.`,
        `Average response time: ${avgTime}s`
      ];
    }

    return new Response(
      JSON.stringify({ insights: Array.isArray(insights) ? insights : [insights] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
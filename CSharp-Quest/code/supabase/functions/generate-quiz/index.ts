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

    // Call Lovable AI to generate quiz question
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
            content: 'You are a quiz question generator. Generate programming-related multiple choice questions. Return ONLY valid JSON with no markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: `Generate a unique, diverse programming quiz question with difficulty level ${difficultyLevel} (1=easy, 10=expert). 
            
Topics: Focus ONLY on C programming language and Python programming language. Cover topics like:
- C: pointers, memory management, structs, file I/O, preprocessor directives, data types, operators, control flow
- Python: data structures (lists, dicts, sets), list comprehensions, decorators, generators, lambda functions, modules, exception handling, OOP concepts

Diversity: Generate varied questions across different topics. Avoid repetitive basic syntax questions. Include practical coding scenarios, output predictions, and conceptual understanding.

Return a JSON object with: question (string), options (array of 4 strings), correctAnswer (number 0-3), and explanation (string).`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content from AI');
    }

    // Parse the JSON response from AI
    let questionData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questionData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Validate required fields
    if (!questionData.question || !Array.isArray(questionData.options) || 
        questionData.options.length !== 4 || 
        typeof questionData.correctAnswer !== 'number') {
      console.error('Invalid question data structure:', questionData);
      throw new Error('AI returned incomplete question data');
    }

    return new Response(
      JSON.stringify({
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        difficulty: difficultyLevel,
        explanation: questionData.explanation || 'No explanation provided.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
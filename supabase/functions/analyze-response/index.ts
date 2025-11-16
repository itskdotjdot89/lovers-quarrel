import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { responseText, cardId, questionText } = await req.json();
    
    // Input validation
    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Response text is required and must be a string');
    }
    if (responseText.trim().length === 0) {
      throw new Error('Response text cannot be empty');
    }
    if (responseText.length > 10000) {
      throw new Error('Response text exceeds maximum length of 10,000 characters');
    }
    
    if (!cardId || typeof cardId !== 'string') {
      throw new Error('Card ID is required and must be a string');
    }
    if (cardId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(cardId)) {
      throw new Error('Card ID must be alphanumeric (max 100 characters)');
    }
    
    if (questionText && typeof questionText === 'string' && questionText.length > 1000) {
      throw new Error('Question text exceeds maximum length of 1,000 characters');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI for psychological analysis
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
            content: `You are a relationship psychology expert analyzing responses to intimate questions. Provide thoughtful, empathetic insights about the person's emotional state, communication style, and relationship dynamics based on their answer. Be supportive and constructive. Structure your analysis with:
1. Sentiment (positive/neutral/reflective/vulnerable)
2. Key themes (2-3 main themes)
3. Psychological insights (2-3 paragraphs of empathetic analysis)

Keep the tone warm, non-judgmental, and encouraging.`
          },
          {
            role: 'user',
            content: `Question: "${questionText || 'Unknown question'}"\n\nResponse: "${responseText}"\n\nPlease provide a psychological analysis of this response.`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    const analysisText = aiResult.choices[0].message.content;

    // Parse the analysis to extract structured data
    const sentimentMatch = analysisText.match(/sentiment[:\s]*(\w+)/i);
    const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
    
    const themesMatch = analysisText.match(/themes?[:\s]*(.+?)(?=\n\n|\d\.|$)/is);
    const keyThemes = themesMatch 
      ? themesMatch[1].split(/[,\n]/).map((t: string) => t.trim()).filter((t: string) => t && t.length > 3).slice(0, 3)
      : [];

    // Store response in database
    const { data: responseData, error: responseError } = await supabaseClient
      .from('card_responses')
      .insert({
        user_id: user.id,
        card_id: cardId,
        response_text: responseText,
        response_type: 'text'
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error storing response:', responseError);
      throw responseError;
    }

    // Store AI analysis
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('ai_analyses')
      .insert({
        response_id: responseData.id,
        analysis_text: analysisText,
        sentiment,
        key_themes: keyThemes,
        psychological_insights: analysisText
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error storing analysis:', analysisError);
      throw analysisError;
    }

    return new Response(
      JSON.stringify({
        analysis: analysisText,
        sentiment,
        keyThemes,
        responseId: responseData.id,
        analysisId: analysisData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
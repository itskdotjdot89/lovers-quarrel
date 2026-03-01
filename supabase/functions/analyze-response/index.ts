import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DeckMood = 'freaky' | 'real_talk' | 'love_drunk';
type AnalysisDepth = 'brief' | 'standard' | 'deep';

const DECK_PERSONAS: Record<DeckMood, { name: string; tone: string; focus: string }> = {
  freaky: {
    name: 'Playful Intimacy Coach',
    tone: 'fun, flirty, and lighthearted with a wink',
    focus: 'intimacy exploration, comfort with desire, playful communication between partners'
  },
  real_talk: {
    name: 'Relationship Depth Counselor',
    tone: 'warm, thoughtful, and genuinely curious',
    focus: 'emotional vulnerability, deeper connection, understanding each other\'s inner worlds'
  },
  love_drunk: {
    name: 'Romantic Connection Guide',
    tone: 'romantic, dreamy, and celebratory of love',
    focus: 'appreciation, romance, cherishing the relationship and building memories together'
  }
};

const DEPTH_CONFIG: Record<AnalysisDepth, { instructions: string; maxTokens: number }> = {
  brief: {
    instructions: 'Keep your response to 2-3 sentences in a single paragraph. Focus on one key insight and one actionable suggestion.',
    maxTokens: 250
  },
  standard: {
    instructions: 'Provide a balanced analysis in NO MORE than 2 short paragraphs: identify the emotional sentiment, 2-3 key themes, and practical insights for the couple. Be concise.',
    maxTokens: 400
  },
  deep: {
    instructions: 'Provide a thoughtful exploration in NO MORE than 2 paragraphs: identify emotional layers, 3-4 key themes, relationship dynamics, and offer 1-2 specific conversation starters. Keep it focused and actionable.',
    maxTokens: 500
  }
};

const buildSystemPrompt = (deckId: DeckMood | null, depth: AnalysisDepth): string => {
  const persona = deckId ? DECK_PERSONAS[deckId] : DECK_PERSONAS.real_talk;
  const depthConfig = DEPTH_CONFIG[depth];
  
  return `You are the "${persona.name}" – a relationship psychology expert with a ${persona.tone} approach. Your specialty is ${persona.focus}.

Analyze the user's response to an intimate couples question. Be supportive, non-judgmental, and encouraging.

${depthConfig.instructions}

Structure your response:
1. **Emotional Tone**: One word (positive/neutral/reflective/vulnerable/playful/passionate)
2. **Key Themes**: List 2-4 themes that emerged
3. **Insights**: Your analysis based on the depth requested

Remember: This is about helping couples connect deeper. Celebrate vulnerability, encourage honest communication, and highlight growth opportunities.`;
};

const buildCouplesSystemPrompt = (deckId: DeckMood | null): string => {
  const persona = deckId ? DECK_PERSONAS[deckId] : DECK_PERSONAS.real_talk;
  
  return `You are the "${persona.name}" – a relationship psychology expert with a ${persona.tone} approach. Your specialty is ${persona.focus}.

You are analyzing BOTH partners' answers to the same intimate question. Compare and contrast their responses thoughtfully.

Provide a warm, insightful analysis in 2-3 short paragraphs:
1. **Compatibility**: What their answers reveal about their connection — where they align and what that means.
2. **Differences**: Any contrasts and what they might indicate — frame these positively as opportunities to learn about each other.
3. **Conversation Starter**: End with one specific, fun conversation starter they can use right now based on their answers.

Be playful, supportive, and never judgmental. Celebrate both alignment AND differences as signs of a dynamic relationship.`;
};

async function handleCouplesAnalysis(
  req: Request,
  user: { id: string },
  params: { cardId: string; questionText: string; deckId: string; player1Response: string; player2Response: string; player1Name: string; player2Name: string },
  supabaseClient: any
) {
  const { cardId, questionText, deckId, player1Response, player2Response, player1Name, player2Name } = params;

  const validDecks: DeckMood[] = ['freaky', 'real_talk', 'love_drunk'];
  const validatedDeckId: DeckMood | null = deckId && validDecks.includes(deckId as DeckMood) ? deckId as DeckMood : null;

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const systemPrompt = buildCouplesSystemPrompt(validatedDeckId);

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Question: "${questionText || 'Unknown question'}"\n\n${player1Name || 'Player 1'}'s answer: "${player1Response}"\n\n${player2Name || 'Player 2'}'s answer: "${player2Response}"\n\nAnalyze both answers together.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('Lovable AI error:', errorText);
    throw new Error(`AI analysis failed: ${errorText}`);
  }

  const aiResult = await aiResponse.json();
  const analysisText = aiResult.choices[0].message.content;

  return new Response(
    JSON.stringify({
      analysis: analysisText,
      sentiment: 'couples',
      keyThemes: [],
      couplesMode: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

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

    const { responseText, cardId, questionText, deckId, depth = 'standard', couplesMode, player1Response, player2Response, player1Name, player2Name } = await req.json();
    
    // Couples mode: analyze both players together
    if (couplesMode && player1Response && player2Response) {
      return await handleCouplesAnalysis(req, user, { cardId, questionText, deckId, player1Response, player2Response, player1Name, player2Name }, supabaseClient);
    }
    
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

    // Validate depth
    const validDepths: AnalysisDepth[] = ['brief', 'standard', 'deep'];
    const analysisDepth: AnalysisDepth = validDepths.includes(depth) ? depth : 'standard';
    
    // Validate deckId
    const validDecks: DeckMood[] = ['freaky', 'real_talk', 'love_drunk'];
    const validatedDeckId: DeckMood | null = deckId && validDecks.includes(deckId) ? deckId : null;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = buildSystemPrompt(validatedDeckId, analysisDepth);
    const depthConfig = DEPTH_CONFIG[analysisDepth];

    // Call Lovable AI for psychological analysis
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Question: "${questionText || 'Unknown question'}"\n\nTheir Response: "${responseText}"\n\nProvide your analysis.`
          }
        ],
        temperature: 0.7,
        max_tokens: depthConfig.maxTokens
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
    const sentimentMatch = analysisText.match(/(?:emotional\s*tone|sentiment)[:\s]*\**(\w+)\**/i);
    const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : 'neutral';
    
    const themesMatch = analysisText.match(/(?:key\s*)?themes?[:\s]*(.+?)(?=\n\n|\d\.|insights?:|$)/is);
    const keyThemes = themesMatch 
      ? themesMatch[1]
          .replace(/\*\*/g, '')
          .split(/[,\n•\-]/)
          .map((t: string) => t.trim())
          .filter((t: string) => t && t.length > 3 && t.length < 50)
          .slice(0, 4)
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
        analysisId: analysisData.id,
        depth: analysisDepth,
        deckId: validatedDeckId
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
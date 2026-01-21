import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import GameCard from '@/components/GameCard';
import AIAnalysisDialog from '@/components/AIAnalysisDialog';
import MultiplayerResponseInput from '@/components/MultiplayerResponseInput';
import OpenEndedInput from '@/components/OpenEndedInput';
import PartnerResponses from '@/components/PartnerResponses';
import { Card as CardType } from '@/types/game';
import { loadFavorites, saveFavorites, toggleFavorite, shuffleCards } from '@/lib/gameLogic';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { usePresence } from '@/hooks/usePresence';

const Gameplay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [cards, setCards] = useState<CardType[]>([]);
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{text: string; sentiment: string; themes: string[]; question: string} | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const { presences, updateStatus } = usePresence(sessionId);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<{ choice: string; responseText: string; cardSubtype: string } | null>(null);
  const [sayItResponse, setSayItResponse] = useState('');

  const analyzeChoice = async (responseText: string) => {
    if (!currentCard) return;
    
    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to get AI insights');
        return;
      }

      const { data, error } = await supabase.functions.invoke('analyze-response', {
        body: {
          responseText,
          cardId: currentCard.id,
          questionText: currentCard.text,
          deckId: currentCard.deckId
        }
      });

      if (error) throw error;

      setCurrentAnalysis({
        text: data.analysis,
        sentiment: data.sentiment,
        themes: data.keyThemes,
        question: currentCard.text
      });
      setShowAnalysisDialog(true);
      setPendingChoice(null);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const skipAnalysis = () => {
    setPendingChoice(null);
    setSayItResponse('');
  };

  useEffect(() => {
    if (sessionId) {
      loadMultiplayerSession();
      subscribeToSession();
    } else {
      loadSoloSession();
    }
    setFavorites(loadFavorites());
  }, [sessionId]);

  const loadSoloSession = async () => {
    setLoading(true);
    const configStr = localStorage.getItem('lq_session_config');
    if (!configStr) {
      navigate('/decks');
      return;
    }
    const config = JSON.parse(configStr);
    
    // Fetch cards from database
    const { data: dbCards, error } = await supabase
      .from('cards')
      .select('*')
      .in('deck_id', config.deckIds)
      .eq('is_active', true);
    
    if (error || !dbCards || dbCards.length === 0) {
      toast.error('Failed to load cards');
      navigate('/decks');
      return;
    }
    
    // Filter by spice level
    const filteredCards = dbCards.filter(card => {
      if (config.intensity === 'soft') return card.spice === 'soft';
      if (config.intensity === 'standard') return card.spice === 'soft' || card.spice === 'standard';
      return true; // spicy includes all
    });
    
    // Map database cards to CardType format
    const mappedCards: CardType[] = filteredCards.map(card => ({
      id: card.id,
      deckId: card.deck_id as CardType['deckId'],
      subtype: card.subtype as CardType['subtype'],
      text: card.text,
      choiceA: card.choice_a || undefined,
      choiceB: card.choice_b || undefined,
      spice: card.spice as CardType['spice'],
      isActive: card.is_active,
      createdAt: new Date(card.created_at).getTime()
    }));
    
    // Shuffle the cards
    const shuffled = shuffleCards(mappedCards);
    
    setCards(shuffled);
    setTotalCards(shuffled.length);
    setCurrentCard(shuffled[0]);
    setCurrentIndex(0);
    setLoading(false);
  };

  const loadMultiplayerSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session } = await supabase.from('game_sessions').select('*').eq('id', sessionId).single();
    if (!session) return;

    setIsHost(session.host_id === user.id);
    setCurrentIndex(session.current_card_index);

    // Get session cards with their order
    const { data: sessionCards } = await supabase
      .from('session_cards')
      .select('card_id, card_order')
      .eq('session_id', sessionId)
      .order('card_order');
    
    if (sessionCards && sessionCards.length > 0) {
      setTotalCards(sessionCards.length);
      
      // Get all card IDs
      const cardIds = sessionCards.map(sc => sc.card_id);
      
      // Fetch actual card data from database
      const { data: dbCards } = await supabase
        .from('cards')
        .select('*')
        .in('id', cardIds);
      
      if (dbCards) {
        // Create a map for quick lookup
        const cardMap = new Map(dbCards.map(c => [c.id, c]));
        
        // Map and order cards according to session_cards order
        const orderedCards: CardType[] = sessionCards
          .map(sc => cardMap.get(sc.card_id))
          .filter(Boolean)
          .map(card => ({
            id: card!.id,
            deckId: card!.deck_id as CardType['deckId'],
            subtype: card!.subtype as CardType['subtype'],
            text: card!.text,
            choiceA: card!.choice_a || undefined,
            choiceB: card!.choice_b || undefined,
            spice: card!.spice as CardType['spice'],
            isActive: card!.is_active,
            createdAt: new Date(card!.created_at).getTime()
          }));
        
        setCards(orderedCards);
        setCurrentCard(orderedCards[session.current_card_index] || null);
      }
    }

    const { data: parts } = await supabase.from('session_participants').select('*').eq('session_id', sessionId);
    if (parts) {
      setParticipants(parts);
      const currentParticipant = parts.find(p => p.user_id === user.id);
      if (currentParticipant?.display_name) {
        setCurrentUserDisplayName(currentParticipant.display_name);
      }
    }
    
    setLoading(false);
    await loadResponses();
  };

  const loadResponses = async () => {
    if (!sessionId || !currentCard) return;
    const { data } = await supabase
      .from('session_responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('card_id', currentCard.id)
      .order('created_at', { ascending: true });
    if (data) setResponses(data);
  };

  useEffect(() => {
    if (sessionId && currentCard) {
      loadResponses();
    }
  }, [sessionId, currentCard]);

  const subscribeToSession = () => {
    if (!sessionId) return;
    const channel = supabase.channel(`game_${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_sessions', 
        filter: `id=eq.${sessionId}` 
      }, () => loadMultiplayerSession())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'session_responses', 
        filter: `session_id=eq.${sessionId}` 
      }, () => loadResponses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleNext = async () => {
    if (sessionId) {
      // Multiplayer mode
      if (!isHost) {
        toast.error('Only host can advance');
        return;
      }
      await supabase.from('game_sessions').update({ current_card_index: currentIndex + 1 }).eq('id', sessionId);
    } else {
      // Solo mode
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < cards.length) {
        setCurrentCard(cards[nextIndex]);
        setCurrentIndex(nextIndex);
      } else {
        toast.info('No more cards in this session');
      }
    }
  };

  const handleFavorite = () => {
    if (!currentCard) return;
    const newFavorites = toggleFavorite(currentCard.id, favorites);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    toast.success(newFavorites.includes(currentCard.id) ? 'Added to favorites' : 'Removed from favorites');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading cards...</p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">No cards available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
          {sessionId && <Card className="px-4 py-2 flex items-center gap-2"><Users className="w-4 h-4" /><span className="text-sm">{participants.length} Players</span></Card>}
          <div className="text-sm">{currentIndex + 1} / {totalCards}</div>
        </div>
        <div className="flex flex-col items-center">
          {isAnalyzing && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-foreground font-ui">Analyzing your response...</p>
              </div>
            </div>
          )}
          
          <GameCard 
            card={currentCard} 
            isFavorite={favorites.includes(currentCard.id)} 
            onFavorite={handleFavorite}
            onChoice={async (choice) => {
              if (sessionId) {
                // Multiplayer mode
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase.from('session_responses').insert({
                  session_id: sessionId,
                  card_id: currentCard.id,
                  user_id: user.id,
                  response_type: 'choice',
                  choice: choice
                });
              }
              
              // Build response text based on card type
              let responseText = '';
              
              if (currentCard.subtype === 'this_or_that') {
                responseText = `I chose "${choice === 'A' ? currentCard.choiceA : currentCard.choiceB}" over "${choice === 'A' ? currentCard.choiceB : currentCard.choiceA}"`;
              } else if (currentCard.subtype === 'say_sip_strip') {
                responseText = `I chose to: ${choice}`;
              } else {
                responseText = `My choice: ${choice}`;
              }
              
              toast.success(responseText);
              // Set pending choice to show AI analysis option
              setPendingChoice({ choice, responseText, cardSubtype: currentCard.subtype });
            }}
            responseInputComponent={
              currentCard.subtype === 'open_ended' ? (
                sessionId ? (
                  <MultiplayerResponseInput
                    sessionId={sessionId}
                    cardId={currentCard.id}
                    onResponseSubmitted={loadResponses}
                    onStatusChange={(status) => updateStatus(status, currentUserDisplayName)}
                  />
                ) : (
                  <OpenEndedInput
                    cardId={currentCard.id}
                    questionText={currentCard.text}
                    deckId={currentCard.deckId}
                    onAnalysisComplete={(analysis, sentiment, themes) => {
                      setCurrentAnalysis({ text: analysis, sentiment, themes, question: currentCard.text });
                      setShowAnalysisDialog(true);
                    }}
                  />
                )
              ) : undefined
            }
          />
          
          {sessionId && (
            <div className="mt-6 w-full max-w-2xl">
              <PartnerResponses
                sessionId={sessionId}
                cardId={currentCard.id}
                responses={responses}
                participants={participants}
                presences={presences}
              />
            </div>
          )}
          {pendingChoice && (
            <div className="mt-4 w-full max-w-2xl">
              <Card className="p-4 bg-muted/30 border-secondary/30">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Want AI insights on your choice?
                </p>
                
                {/* Show input box for "Say it" choice */}
                {pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && (
                  <div className="mb-4">
                    <textarea
                      value={sayItResponse}
                      onChange={(e) => setSayItResponse(e.target.value)}
                      placeholder="What did you say? Share your response for AI insights..."
                      className="w-full p-3 rounded-lg border border-secondary/30 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 resize-none"
                      rows={3}
                    />
                  </div>
                )}
                
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipAnalysis}
                  >
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const responseText = pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && sayItResponse.trim()
                        ? `I chose to say: "${sayItResponse.trim()}"`
                        : pendingChoice.responseText;
                      analyzeChoice(responseText);
                      setSayItResponse('');
                    }}
                    disabled={pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && !sayItResponse.trim()}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    Get AI Insights
                  </Button>
                </div>
              </Card>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button onClick={() => handleNext()} disabled={sessionId && !isHost}>Next Card</Button>
          </div>
        </div>
      </div>
      <AIAnalysisDialog 
        open={showAnalysisDialog} 
        onOpenChange={setShowAnalysisDialog} 
        analysis={currentAnalysis?.text || ''} 
        question={currentAnalysis?.question}
        sentiment={currentAnalysis?.sentiment}
        keyThemes={currentAnalysis?.themes}
      />
    </div>
  );
};

export default Gameplay;
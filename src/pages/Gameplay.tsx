import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Loader2, ChevronRight, Sparkles, Mic, Square } from 'lucide-react';
import PassThePhone from '@/components/PassThePhone';
import RoundComparison from '@/components/RoundComparison';
import GameCard from '@/components/GameCard';
import AIAnalysisDialog from '@/components/AIAnalysisDialog';
import MultiplayerResponseInput from '@/components/MultiplayerResponseInput';
import OpenEndedInput from '@/components/OpenEndedInput';
import PartnerResponses from '@/components/PartnerResponses';
import PaywallOverlay from '@/components/PaywallOverlay';
import { Card as CardType } from '@/types/game';
import { loadFavorites, saveFavorites, toggleFavorite, shuffleCards } from '@/lib/gameLogic';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';
import { useFreemiumLimit } from '@/hooks/useFreemiumLimit';

const Gameplay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const [cards, setCards] = useState<CardType[]>([]);
  const cardsRef = useRef<CardType[]>([]);
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
  const [isFlipping, setIsFlipping] = useState(false);
  const [sayItResponse, setSayItResponse] = useState('');
  const [isSayItRecording, setIsSayItRecording] = useState(false);
  const [isSayItTranscribing, setIsSayItTranscribing] = useState(false);
  const sayItMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sayItChunksRef = useRef<Blob[]>([]);
  const { shouldShowPaywall, recordCardView, cardsViewed, freeCardsRemaining, FREE_CARD_LIMIT } = useFreemiumLimit();

  // Couples local (one device) turn-taking state
  const configStr = localStorage.getItem('lq_session_config');
  const sessionConfig = configStr ? JSON.parse(configStr) : null;
  const isCouplesLocal = !sessionId && sessionConfig?.mode === 'couples_local';
  const [playerNames] = useState<[string, string]>(() => {
    if (isCouplesLocal) {
      const names = sessionConfig?.playerNames;
      return names && names.length === 2 ? names : ['Player 1', 'Player 2'];
    }
    return ['Player 1', 'Player 2'];
  });
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showPassScreen, setShowPassScreen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [localResponses, setLocalResponses] = useState<Record<string, { player1?: { choice?: string; choiceLabel?: string; responseText?: string }; player2?: { choice?: string; choiceLabel?: string; responseText?: string } }>>({});
  const currentPlayerName = isCouplesLocal ? playerNames[currentPlayerIndex] : '';

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

  const startSayItRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      sayItMediaRecorderRef.current = mediaRecorder;
      sayItChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sayItChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(sayItChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeSayItAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsSayItRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopSayItRecording = () => {
    if (sayItMediaRecorderRef.current && isSayItRecording) {
      sayItMediaRecorderRef.current.stop();
      setIsSayItRecording(false);
    }
  };

  const transcribeSayItAudio = async (audioBlob: Blob) => {
    setIsSayItTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use voice input');
        return;
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        }
      );

      if (!response.ok) throw new Error('Transcription failed');

      const { text } = await response.json();
      setSayItResponse(prev => prev ? `${prev} ${text}` : text);
      toast.success('Audio transcribed');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsSayItTranscribing(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadMultiplayerSession();
      const cleanup = subscribeToSession();

      // Adaptive polling: starts at 1s, backs off to 5s when idle, resets on change
      const pollIntervalRef = { current: 1000 };
      let pollTimeout: ReturnType<typeof setTimeout>;
      let cancelled = false;

      const poll = async () => {
        if (cancelled) return;
        const { data } = await supabase
          .from('game_sessions')
          .select('current_card_index')
          .eq('id', sessionId)
          .single();
        if (data) {
          setCurrentIndex(prev => {
            if (data.current_card_index !== prev) {
              const latestCards = cardsRef.current;
              if (latestCards[data.current_card_index]) {
                setCurrentCard(latestCards[data.current_card_index]);
              }
              // Reset to fast polling on change
              pollIntervalRef.current = 1000;
              return data.current_card_index;
            }
            // Back off: increase interval by 1.5x, cap at 5s
            pollIntervalRef.current = Math.min(pollIntervalRef.current * 1.5, 5000);
            return prev;
          });
        }
        if (!cancelled) {
          pollTimeout = setTimeout(poll, pollIntervalRef.current);
        }
      };
      pollTimeout = setTimeout(poll, pollIntervalRef.current);

      return () => {
        cleanup?.();
        cancelled = true;
        clearTimeout(pollTimeout);
      };
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
    
    const filteredCards = dbCards.filter(card => {
      if (config.intensity === 'soft') return card.spice === 'soft';
      if (config.intensity === 'standard') return card.spice === 'soft' || card.spice === 'standard';
      return true;
    });
    
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
    
    const shuffled = shuffleCards(mappedCards);
    
    setCards(shuffled);
    cardsRef.current = shuffled;
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

    const { data: sessionCards } = await supabase
      .from('session_cards')
      .select('card_id, card_order')
      .eq('session_id', sessionId)
      .order('card_order');
    
    if (sessionCards && sessionCards.length > 0) {
      setTotalCards(sessionCards.length);
      
      const cardIds = sessionCards.map(sc => sc.card_id);
      
      const { data: dbCards } = await supabase
        .from('cards')
        .select('*')
        .in('id', cardIds);
      
      if (dbCards) {
        const cardMap = new Map(dbCards.map(c => [c.id, c]));
        
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
        cardsRef.current = orderedCards;
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
      }, (payload) => {
        const newIndex = payload.new.current_card_index;
        setCurrentIndex(newIndex);
        setResponses([]); // Clear old card responses immediately
        // Use cardsRef to always read the latest cards array
        const latestCards = cardsRef.current;
        if (latestCards.length > 0 && latestCards[newIndex]) {
          setCurrentCard(latestCards[newIndex]);
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'session_responses', 
        filter: `session_id=eq.${sessionId}` 
      }, (payload) => {
        // Add response directly to state instead of refetching
        setResponses(prev => {
          // Deduplicate
          if (prev.some(r => r.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleNext = async () => {
    // Check freemium limit before advancing (solo mode only)
    if (!sessionId) {
      const canProceed = recordCardView();
      if (!canProceed) {
        // Paywall will be shown via shouldShowPaywall state
        return;
      }
    }

    if (sessionId) {
      if (!isHost) {
        toast.error('Only host can advance');
        return;
      }
      // Trigger flip animation
      setIsFlipping(true);
      setTimeout(async () => {
        await supabase.from('game_sessions').update({ current_card_index: currentIndex + 1 }).eq('id', sessionId);
        setIsFlipping(false);
      }, 300);
    } else {
      const nextIndex = currentIndex + 1;
      
      if (isCouplesLocal) {
        if (currentPlayerIndex === 0) {
          // Player 1 done → pass phone to Player 2 for the SAME card
          setCurrentPlayerIndex(1);
          setShowPassScreen(true);
          // Clear pending choice UI for next player
          setPendingChoice(null);
          setSayItResponse('');
        } else {
          // Player 2 done → show comparison
          setPendingChoice(null);
          setSayItResponse('');
          setShowComparison(true);
        }
      } else {
        if (nextIndex < cards.length) {
          // Trigger flip animation
          setIsFlipping(true);
          setTimeout(() => {
            setCurrentCard(cards[nextIndex]);
            setCurrentIndex(nextIndex);
            setIsFlipping(false);
          }, 300);
        } else {
          toast.info('No more cards in this session');
        }
      }
    }
  };

  const [pendingNextIndex, setPendingNextIndex] = useState<number | null>(null);

  const handlePassReady = () => {
    setShowPassScreen(false);
    if (pendingNextIndex !== null) {
      // Advancing to next card (after comparison)
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentCard(cards[pendingNextIndex]);
        setCurrentIndex(pendingNextIndex);
        setIsFlipping(false);
        setPendingNextIndex(null);
      }, 300);
    }
    // Otherwise Player 2 sees the same card — no advance needed
  };

  const handleComparisonContinue = () => {
    setShowComparison(false);
    const nextIndex = currentIndex + 1;
    if (nextIndex < cards.length) {
      // Reset to Player 1 and pass phone
      setCurrentPlayerIndex(0);
      setShowPassScreen(true);
      setPendingNextIndex(nextIndex);
    } else {
      toast.info('No more cards in this session');
    }
  };

  const storeCouplesLocalResponse = (choice?: string, choiceLabel?: string, responseText?: string) => {
    if (!currentCard) return;
    const playerKey = currentPlayerIndex === 0 ? 'player1' : 'player2';
    setLocalResponses(prev => ({
      ...prev,
      [currentCard.id]: {
        ...prev[currentCard.id],
        [playerKey]: { choice, choiceLabel, responseText }
      }
    }));
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
      <div className="min-h-screen bg-gradient-game flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-crimson-glow" />
          <p className="text-muted-foreground font-card text-lg">Loading your cards...</p>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-foreground font-card text-xl mb-4">No cards available</p>
          <Button onClick={() => navigate('/decks')} variant="outline">
            Choose Decks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-crimson-vivid/8 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Exit
          </Button>
          
          {sessionId && (
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border border-border/50">
              <Users className="w-4 h-4 text-crimson-glow" />
              <span className="text-sm font-medium">{participants.length} Players</span>
            </div>
          )}

          {isCouplesLocal && (
            <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border border-primary/30 bg-primary/5">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{currentPlayerName}'s turn</span>
            </div>
          )}
          
          {/* Card counter with free cards indicator */}
          <div className="flex items-center gap-2">
            {/* Free cards remaining indicator (solo mode, non-premium only) */}
            {!sessionId && freeCardsRemaining > 0 && freeCardsRemaining <= FREE_CARD_LIMIT && (
              <div className="glass px-3 py-2 rounded-full border border-primary/30 bg-primary/5">
                <span className="text-xs font-medium text-primary">
                  {freeCardsRemaining} free left
                </span>
              </div>
            )}
            
            <div className="glass px-4 py-2 rounded-full border border-border/50">
              <span className="text-sm font-mono text-muted-foreground">
                <span className="text-foreground font-semibold">{currentIndex + 1}</span>
                <span className="mx-1">/</span>
                <span>{totalCards}</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-col items-center">
          {/* Loading overlay */}
          {isAnalyzing && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-crimson-glow" />
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-gold animate-pulse" />
                </div>
                <p className="text-foreground font-card text-lg">Analyzing your response...</p>
              </div>
            </div>
          )}
          
          <GameCard 
            card={currentCard} 
            isFavorite={favorites.includes(currentCard.id)}
            isFlipping={isFlipping}
            onFavorite={handleFavorite}
            onChoice={async (choice) => {
              if (sessionId) {
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
              
              let responseText = '';
              let choiceLabel = '';
              
              if (currentCard.subtype === 'this_or_that') {
                choiceLabel = choice === 'A' ? (currentCard.choiceA || 'A') : (currentCard.choiceB || 'B');
                responseText = `I chose "${choiceLabel}" over "${choice === 'A' ? currentCard.choiceB : currentCard.choiceA}"`;
              } else if (currentCard.subtype === 'say_sip_strip') {
                choiceLabel = choice;
                responseText = `I chose to: ${choice}`;
              } else {
                choiceLabel = choice;
                responseText = `My choice: ${choice}`;
              }
              
              // Store for couples local comparison
              if (isCouplesLocal) {
                storeCouplesLocalResponse(choice, choiceLabel);
              }
              
              toast.success(responseText);
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
                    couplesMode={isCouplesLocal}
                    onSubmitOnly={isCouplesLocal ? (text) => {
                      storeCouplesLocalResponse(undefined, undefined, text);
                      toast.success('Response submitted');
                      handleNext();
                    } : undefined}
                    onAnalysisComplete={(analysis, sentiment, themes) => {
                      setCurrentAnalysis({ text: analysis, sentiment, themes, question: currentCard.text });
                      setShowAnalysisDialog(true);
                    }}
                  />
                )
              ) : undefined
            }
          />
          
          {/* Partner responses (multiplayer) */}
          {sessionId && (
            <div className="mt-6 w-full max-w-2xl">
              <PartnerResponses
                sessionId={sessionId}
                cardId={currentCard.id}
                responses={responses}
                participants={participants}
                presences={presences}
                card={currentCard}
              />
            </div>
          )}
          
          {/* AI Analysis prompt */}
          {pendingChoice && !isCouplesLocal && !sessionId && (
            <div className="mt-6 w-full max-w-2xl animate-slide-up">
              <div className="glass rounded-xl p-6 border border-crimson-vivid/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crimson-vivid/30 to-purple/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-crimson-glow" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Want deeper insights?</p>
                    <p className="text-sm text-muted-foreground">AI can analyze your choice</p>
                  </div>
                </div>
                
                {/* Show input box for "Say it" choice */}
                {pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && (
                  <div className="mb-4">
                    <div className="relative">
                      <textarea
                        value={sayItResponse}
                        onChange={(e) => setSayItResponse(e.target.value)}
                        placeholder="What did you say? Type or use the mic..."
                        className="w-full p-4 pr-14 rounded-xl border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-crimson-vivid/50 focus:border-crimson-vivid/50 resize-none font-card text-lg transition-all"
                        rows={3}
                        disabled={isSayItRecording || isSayItTranscribing}
                      />
                      <Button
                        type="button"
                        onClick={isSayItRecording ? stopSayItRecording : startSayItRecording}
                        variant={isSayItRecording ? "destructive" : "ghost"}
                        size="icon"
                        className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
                        disabled={isSayItTranscribing || isAnalyzing}
                      >
                        {isSayItTranscribing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : isSayItRecording ? (
                          <Square className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    {isSayItRecording && (
                      <p className="text-xs text-crimson-glow animate-pulse text-center mt-2">Recording... tap to stop</p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={skipAnalysis}
                    className="flex-1 border-border/50 hover:border-muted-foreground/50"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={() => {
                      const responseText = pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && sayItResponse.trim()
                        ? `I chose to say: "${sayItResponse.trim()}"`
                        : pendingChoice.responseText;
                      analyzeChoice(responseText);
                      setSayItResponse('');
                    }}
                    disabled={pendingChoice.cardSubtype === 'say_sip_strip' && pendingChoice.choice === 'Say it' && !sayItResponse.trim()}
                    className="flex-1 bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Insights
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Next button */}
          <div className="mt-8">
            <Button 
              onClick={() => handleNext()} 
              disabled={sessionId && !isHost}
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow group"
            >
              Next Card
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
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
      
      {/* Paywall overlay for free users who've hit the limit */}
      {shouldShowPaywall && (
        <PaywallOverlay cardsViewed={cardsViewed} onClose={() => navigate('/decks')} />
      )}

      {/* Pass the phone overlay for couples local mode */}
      {showPassScreen && (
        <PassThePhone
          nextPlayerName={playerNames[currentPlayerIndex]}
          onReady={handlePassReady}
        />
      )}

      {/* Round comparison overlay for couples local mode */}
      {showComparison && currentCard && (
        <RoundComparison
          card={currentCard}
          player1Response={{
            playerName: playerNames[0],
            ...(localResponses[currentCard.id]?.player1 || {})
          }}
          player2Response={{
            playerName: playerNames[1],
            ...(localResponses[currentCard.id]?.player2 || {})
          }}
          onContinue={handleComparisonContinue}
        />
      )}
    </div>
  );
};

export default Gameplay;
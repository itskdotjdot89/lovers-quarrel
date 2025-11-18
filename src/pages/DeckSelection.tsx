import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import DeckCard from '@/components/DeckCard';
import SessionModeSelector from '@/components/SessionModeSelector';
import SessionSetup from '@/components/SessionSetup';
import WaitingRoom from '@/components/WaitingRoom';
import { DECKS } from '@/data/decks';
import { DeckMood, SpiceLevel } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { shuffleCards, filterCards } from '@/lib/gameLogic';
import { SEED_CARDS } from '@/data/seedCards';

const DeckSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedDecks, setSelectedDecks] = useState<DeckMood[]>(['freaky']);
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');
  const [showTooltips, setShowTooltips] = useState(false);
  const [sessionMode, setSessionMode] = useState<'solo' | 'couples' | null>(null);
  const [setupStep, setSetupStep] = useState<'mode' | 'setup' | 'waiting' | 'decks'>('mode');
  const [sessionData, setSessionData] = useState<{
    id: string;
    code: string;
    isHost: boolean;
  } | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    const firstTime = searchParams.get('first_time') === 'true';
    if (firstTime) {
      setShowTooltips(true);
      const timer = setTimeout(() => setShowTooltips(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const toggleDeck = (deckId: DeckMood) => {
    setSelectedDecks(prev =>
      prev.includes(deckId)
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    );
  };

  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleModeSelect = (mode: 'solo' | 'couples') => {
    setSessionMode(mode);
    setSetupStep('decks');
  };

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a session",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      if (selectedDecks.length === 0) {
        toast({
          title: "Select at least one deck",
          description: "Choose one or more decks to continue",
          variant: "destructive"
        });
        return;
      }

      const sessionCode = generateSessionCode();
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          session_code: sessionCode,
          host_id: user.id,
          mode: 'date_night',
          deck_ids: selectedDecks,
          subtypes: [],
          spice_level: intensity,
          status: 'waiting'
        })
        .select()
        .single();

      if (error || !session) {
        // Log full error for debugging
        console.error("Create session failed:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to create session",
          variant: "destructive"
        });
        return;
      }

      await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          user_id: user.id,
          display_name: profile?.display_name || 'Host'
        });

      const filteredCards = filterCards(SEED_CARDS, selectedDecks, [], intensity);
      const shuffled = shuffleCards(filteredCards);

      for (let i = 0; i < shuffled.length; i++) {
        await supabase
          .from('session_cards')
          .insert({
            session_id: session.id,
            card_id: shuffled[i].id,
            card_order: i
          });
      }

      setSessionData({
        id: session.id,
        code: sessionCode,
        isHost: true
      });
      setSetupStep('waiting');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleJoinSession = async (code: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session, error: fetchError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('session_code', code)
      .maybeSingle();

    if (fetchError || !session) {
      toast({
        title: "Session not found",
        description: "Please check the code and try again",
        variant: "destructive"
      });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        user_id: user.id,
        display_name: profile?.display_name || 'Player'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join session",
        variant: "destructive"
      });
      return;
    }

    setSessionData({
      id: session.id,
      code: code,
      isHost: false
    });
    setSetupStep('waiting');
  };

  const handleStartGame = async () => {
    if (!sessionData) return;

    await supabase
      .from('game_sessions')
      .update({ status: 'active' })
      .eq('id', sessionData.id);

    navigate(`/play?session=${sessionData.id}`);
  };

  const handleCancelSession = async () => {
    if (sessionData) {
      await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionData.id);
    }
    setSessionData(null);
    setSetupStep('mode');
  };

  const handleContinueSolo = () => {
    if (selectedDecks.length === 0) return;
    
    const firstTime = searchParams.get('first_time') === 'true';
    if (firstTime) {
      localStorage.setItem('lq_onboarding_completed', 'true');
    }
    
    localStorage.setItem('lq_session_config', JSON.stringify({
      deckIds: selectedDecks,
      intensity,
      mode: 'date_night',
    }));
    
    navigate('/play');
  };

  if (setupStep === 'mode') {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <SessionModeSelector onSelect={handleModeSelect} />
        </div>
      </div>
    );
  }

  if (setupStep === 'setup') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <SessionSetup
            onCreateSession={handleCreateSession}
            onJoinSession={handleJoinSession}
            onBack={() => setSetupStep('mode')}
            isCreating={isCreatingSession}
          />
        </div>
      </div>
    );
  }

  if (setupStep === 'waiting' && sessionData) {
    return (
      <WaitingRoom
        sessionCode={sessionData.code}
        sessionId={sessionData.id}
        isHost={sessionData.isHost}
        onStart={handleStartGame}
        onCancel={handleCancelSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              if (sessionMode === 'couples') {
                setSetupStep('mode');
              } else {
                navigate('/');
              }
            }}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Choose Your Mood
          </h1>
        </div>

        <Card className="p-6 mb-6 bg-card border-2 border-border relative">
          <TooltipProvider>
            <Tooltip open={showTooltips}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <label className="block font-display text-lg text-foreground">
                    Content Intensity
                  </label>
                  {showTooltips && <Info className="w-4 h-4 text-primary animate-pulse" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>Start with 'Standard' if you're unsure. You can always adjust!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="grid grid-cols-3 gap-3">
            {(['soft', 'standard', 'spicy'] as SpiceLevel[]).map((level) => (
              <Button
                key={level}
                onClick={() => setIntensity(level)}
                variant={intensity === level ? 'default' : 'outline'}
                className={
                  intensity === level
                    ? 'bg-secondary hover:bg-secondary/90 text-foreground'
                    : 'border-border text-muted-foreground hover:border-secondary'
                }
              >
                <span className="capitalize font-card">{level}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-ui mt-3">
            {intensity === 'soft' && 'Gentle prompts, suitable for building intimacy'}
            {intensity === 'standard' && 'Balanced mix of connection and excitement'}
            {intensity === 'spicy' && 'Bold, adventurous questions for the brave'}
          </p>
        </Card>

        <TooltipProvider>
          <Tooltip open={showTooltips}>
            <TooltipTrigger asChild>
              <div>
                {showTooltips && (
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">Tap any deck to select it. Mix multiple moods!</p>
                  </div>
                )}
                <div className="grid gap-4 mb-6">
                  {DECKS.map(deck => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      selected={selectedDecks.includes(deck.id)}
                      onToggle={() => toggleDeck(deck.id)}
                    />
                  ))}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p>Choose at least one deck. You can select multiple!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          onClick={sessionMode === 'couples' ? () => setSetupStep('setup') : handleContinueSolo}
          disabled={selectedDecks.length === 0}
          className={`w-full bg-secondary hover:bg-secondary/90 text-foreground ${
            showTooltips ? 'animate-pulse' : ''
          }`}
          size="lg"
        >
          {sessionMode === 'couples' ? 'Continue' : 'Start Playing'}
        </Button>
      </div>
    </div>
  );
};

export default DeckSelection;

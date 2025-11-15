import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import DeckCard from '@/components/DeckCard';
import { DECKS } from '@/data/decks';
import { DeckMood, SpiceLevel } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const DeckSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDecks, setSelectedDecks] = useState<DeckMood[]>(['freaky']);
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');
  const [showTooltips, setShowTooltips] = useState(false);

  useEffect(() => {
    const firstTime = searchParams.get('first_time') === 'true';
    if (firstTime) {
      setShowTooltips(true);
      // Hide tooltips after 10 seconds
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

  const handleContinue = () => {
    if (selectedDecks.length === 0) return;
    
    // Mark onboarding as completed on first game start
    const firstTime = searchParams.get('first_time') === 'true';
    if (firstTime) {
      localStorage.setItem('lq_onboarding_completed', 'true');
    }
    
    // Store session config
    localStorage.setItem('lq_session_config', JSON.stringify({
      deckIds: selectedDecks,
      intensity,
      mode: 'date_night',
    }));
    
    navigate('/play');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-3xl ml-4 text-foreground">
            Choose Your Mood
          </h1>
        </div>

        {/* Intensity Slider */}
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
            {intensity === 'standard' && 'Balanced mix of intimate and spicy content'}
            {intensity === 'spicy' && 'All content unlocked, maximum heat'}
          </p>
        </Card>

        {/* Deck Selection */}
        <TooltipProvider>
          <Tooltip open={showTooltips}>
            <TooltipTrigger asChild>
              <div className="space-y-4 mb-6">
                {DECKS.map((deck, index) => (
                  <div key={deck.id} className="relative">
                    {index === 0 && showTooltips && (
                      <Info className="absolute -top-2 -right-2 w-5 h-5 text-primary animate-pulse z-10" />
                    )}
                    <DeckCard
                      deck={deck}
                      selected={selectedDecks.includes(deck.id)}
                      onToggle={() => toggleDeck(deck.id)}
                    />
                  </div>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Tap decks to select multiple moods. Mix and match for the perfect vibe!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={selectedDecks.length === 0}
          className={`w-full h-16 bg-secondary hover:bg-secondary/90 text-foreground font-display text-xl card-shadow ${
            showTooltips ? 'animate-pulse ring-4 ring-primary/50' : ''
          }`}
        >
          Start Session
          <span className="ml-2 text-sm font-ui">
            ({selectedDecks.length} deck{selectedDecks.length !== 1 ? 's' : ''})
          </span>
        </Button>

        <p className="text-center text-xs text-muted-foreground font-ui mt-4">
          You can pass on any card • All players must consent
        </p>
      </div>
    </div>
  );
};

export default DeckSelection;

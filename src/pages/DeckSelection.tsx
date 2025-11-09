import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import DeckCard from '@/components/DeckCard';
import { DECKS } from '@/data/decks';
import { DeckMood, SpiceLevel } from '@/types/game';
import { Card } from '@/components/ui/card';

const DeckSelection = () => {
  const navigate = useNavigate();
  const [selectedDecks, setSelectedDecks] = useState<DeckMood[]>(['freaky']);
  const [intensity, setIntensity] = useState<SpiceLevel>('standard');

  const toggleDeck = (deckId: DeckMood) => {
    setSelectedDecks(prev =>
      prev.includes(deckId)
        ? prev.filter(id => id !== deckId)
        : [...prev, deckId]
    );
  };

  const handleContinue = () => {
    if (selectedDecks.length === 0) return;
    
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
        <Card className="p-6 mb-6 bg-card border-2 border-border">
          <label className="block font-display text-lg mb-4 text-foreground">
            Content Intensity
          </label>
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
        <div className="space-y-4 mb-6">
          {DECKS.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              selected={selectedDecks.includes(deck.id)}
              onToggle={() => toggleDeck(deck.id)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={selectedDecks.length === 0}
          className="w-full h-16 bg-secondary hover:bg-secondary/90 text-foreground font-display text-xl card-shadow"
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

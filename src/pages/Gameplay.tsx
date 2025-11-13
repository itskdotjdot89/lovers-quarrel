import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, SkipForward, RotateCcw } from 'lucide-react';
import GameCard from '@/components/GameCard';
import ResponseDialog from '@/components/ResponseDialog';
import AIAnalysisDialog from '@/components/AIAnalysisDialog';
import { SEED_CARDS } from '@/data/seedCards';
import { Card as CardType, Session, SpiceLevel, DeckMood } from '@/types/game';
import { shuffleCards, filterCards, loadFavorites, saveFavorites, toggleFavorite } from '@/lib/gameLogic';
import { toast } from 'sonner';

const Gameplay = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [shuffledCards, setShuffledCards] = useState<CardType[]>([]);
  const [currentCard, setCurrentCard] = useState<CardType | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    text: string;
    sentiment: string;
    themes: string[];
  } | null>(null);

  useEffect(() => {
    // Load session config
    const configStr = localStorage.getItem('lq_session_config');
    if (!configStr) {
      navigate('/decks');
      return;
    }

    const config = JSON.parse(configStr);
    const newSession: Session = {
      id: Date.now().toString(),
      mode: config.mode || 'date_night',
      deckIds: config.deckIds || ['freaky'],
      subtypes: [],
      spice: config.intensity || 'standard',
      players: [],
      playedCardIds: [],
      favorites: [],
      choices: {},
      createdAt: Date.now(),
      currentCardIndex: 0,
    };

    setSession(newSession);
    setFavorites(loadFavorites());

    // Filter and shuffle cards
    const filtered = filterCards(
      SEED_CARDS,
      config.deckIds,
      [],
      config.intensity as SpiceLevel
    );
    const shuffled = shuffleCards(filtered);
    setShuffledCards(shuffled);
    setCurrentCard(shuffled[0] || null);
  }, [navigate]);

  const handleNext = () => {
    if (!session || !shuffledCards.length) return;

    const nextIndex = session.currentCardIndex + 1;
    
    if (nextIndex >= shuffledCards.length) {
      toast.success('Session complete!', {
        description: `You played ${shuffledCards.length} cards`,
      });
      navigate('/');
      return;
    }

    setSession({ ...session, currentCardIndex: nextIndex });
    setCurrentCard(shuffledCards[nextIndex]);
  };

  const handlePass = () => {
    toast.info('Card passed');
    handleNext();
  };

  const handleFavorite = () => {
    if (!currentCard) return;
    
    const newFavorites = toggleFavorite(currentCard.id, favorites);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    
    const isFavorited = newFavorites.includes(currentCard.id);
    toast.success(isFavorited ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleChoice = (choice: 'A' | 'B') => {
    if (!session || !currentCard) return;
    
    setSession({
      ...session,
      choices: { ...session.choices, [currentCard.id]: choice },
    });
    
    toast.success(`You chose: ${choice === 'A' ? currentCard.choiceA : currentCard.choiceB}`);
    
    // Auto-advance after a choice
    setTimeout(handleNext, 1500);
  };

  const handleShuffle = () => {
    if (!session) return;
    
    const filtered = filterCards(
      SEED_CARDS,
      session.deckIds,
      session.subtypes,
      session.spice
    );
    const shuffled = shuffleCards(filtered);
    setShuffledCards(shuffled);
    setCurrentCard(shuffled[0]);
    setSession({ ...session, currentCardIndex: 0 });
    
    toast.success('Deck reshuffled');
  };

  const handleAnalyze = () => {
    setShowResponseDialog(true);
  };

  const handleAnalysisComplete = (analysis: string, sentiment: string, themes: string[]) => {
    setCurrentAnalysis({ text: analysis, sentiment, themes });
    setShowAnalysisDialog(true);
  };

  if (!currentCard || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-card text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-foreground hover:text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="font-ui text-sm text-muted-foreground">
            Card {session.currentCardIndex + 1} of {shuffledCards.length}
          </div>
          
          <Button
            variant="ghost"
            onClick={handleShuffle}
            className="text-foreground hover:text-secondary"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Card Display */}
        <div className="flex-1 flex items-center justify-center py-8">
          <GameCard
            card={currentCard}
            isFavorite={favorites.includes(currentCard.id)}
            onChoice={handleChoice}
            onFavorite={handleFavorite}
            onAnalyze={handleAnalyze}
          />
        </div>

        {/* Response Dialog */}
        {currentCard && (
          <ResponseDialog
            open={showResponseDialog}
            onOpenChange={setShowResponseDialog}
            cardId={currentCard.id}
            questionText={currentCard.text}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {/* Analysis Dialog */}
        {currentAnalysis && (
          <AIAnalysisDialog
            open={showAnalysisDialog}
            onOpenChange={setShowAnalysisDialog}
            analysis={currentAnalysis.text}
            sentiment={currentAnalysis.sentiment}
            keyThemes={currentAnalysis.themes}
          />
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4 pb-6">
          <Button
            onClick={handlePass}
            variant="outline"
            className="h-14 border-2 border-border hover:border-secondary text-foreground font-card"
          >
            Pass
          </Button>
          
          <Button
            onClick={handleNext}
            className="h-14 bg-secondary hover:bg-secondary/90 text-foreground font-card"
          >
            Next <SkipForward className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Gameplay;

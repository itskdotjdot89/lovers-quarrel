import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { loadFavorites } from '@/lib/gameLogic';
import { SEED_CARDS } from '@/data/seedCards';

const Favorites = () => {
  const navigate = useNavigate();
  const [favoriteCards, setFavoriteCards] = useState<typeof SEED_CARDS>([]);

  useEffect(() => {
    const favoriteIds = loadFavorites();
    const cards = SEED_CARDS.filter(card => favoriteIds.includes(card.id));
    setFavoriteCards(cards);
  }, []);

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
            Favorites
          </h1>
        </div>

        {favoriteCards.length === 0 ? (
          <Card className="p-12 bg-card border-2 border-border text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-card text-lg text-muted-foreground">
              No favorites yet
            </p>
            <p className="font-ui text-sm text-muted-foreground mt-2">
              Tap the heart icon during gameplay to save cards
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {favoriteCards.map((card) => (
              <Card
                key={card.id}
                className="p-6 bg-card border-2 border-border hover:border-secondary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-ui text-muted-foreground capitalize">
                        {card.deckId.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-ui text-muted-foreground capitalize">
                        {card.subtype.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-ui text-muted-foreground capitalize">
                        {card.spice}
                      </span>
                    </div>
                    <p className="font-card text-foreground leading-relaxed">
                      {card.text}
                    </p>
                  </div>
                  <Heart className="w-5 h-5 text-secondary fill-current ml-4 flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

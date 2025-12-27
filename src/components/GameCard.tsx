import { Card as CardType } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: CardType;
  isFavorite: boolean;
  onChoice?: (choice: string) => void;
  onFavorite: () => void;
  responseInputComponent?: React.ReactNode;
}

const GameCard = ({ card, isFavorite, onChoice, onFavorite, responseInputComponent }: GameCardProps) => {
  const renderCardContent = () => {
    switch (card.subtype) {
      case 'this_or_that':
        return (
          <div className="space-y-6">
            <p className="font-card text-2xl leading-relaxed text-center text-foreground mb-8">
              {card.text}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => onChoice?.('A')}
                variant="outline"
                className="h-auto py-6 text-lg font-card border-2 border-secondary hover:bg-secondary/20 hover:border-secondary text-foreground"
              >
                {card.choiceA}
              </Button>
              <Button
                onClick={() => onChoice?.('B')}
                variant="outline"
                className="h-auto py-6 text-lg font-card border-2 border-secondary hover:bg-secondary/20 hover:border-secondary text-foreground"
              >
                {card.choiceB}
              </Button>
            </div>
          </div>
        );
      
      case 'say_sip_strip':
        return (
          <div className="space-y-8">
            <p className="font-card text-2xl leading-relaxed text-center text-foreground">
              {card.text}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['Say it', 'Sip it', 'Strip it'].map((action) => (
                <Button
                  key={action}
                  onClick={() => onChoice?.(action)}
                  variant="outline"
                  className="h-16 text-sm font-card border-2 border-secondary hover:bg-secondary/20 hover:border-secondary text-foreground"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 'open_ended':
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center min-h-[120px]">
              <p className="font-card text-2xl leading-relaxed text-center text-foreground px-4">
                {card.text}
              </p>
            </div>
            {responseInputComponent}
          </div>
        );
    }
  };

  return (
    <Card className="relative bg-card border-2 border-secondary card-shadow p-8 max-w-2xl w-full">
      {/* Wax seal watermark */}
      <div className="absolute bottom-4 right-4 opacity-5 text-secondary">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" />
          <text
            x="50"
            y="65"
            fontSize="36"
            fontFamily="var(--font-display)"
            textAnchor="middle"
            fill="white"
          >
            LQ
          </text>
        </svg>
      </div>
      
      {/* Favorite button */}
      <button
        onClick={onFavorite}
        className={cn(
          "absolute top-4 right-4 p-2 rounded-full transition-colors z-10",
          isFavorite 
            ? "text-secondary" 
            : "text-muted-foreground hover:text-secondary"
        )}
      >
        <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
      </button>
      
      {/* Spice indicator */}
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-muted/50 text-xs font-ui text-muted-foreground capitalize">
        {card.spice}
      </div>
      
      <div className="mt-8">
        {renderCardContent()}
      </div>
    </Card>
  );
};

export default GameCard;

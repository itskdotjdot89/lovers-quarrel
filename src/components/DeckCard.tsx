import { Deck } from '@/types/game';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DeckCardProps {
  deck: Deck;
  selected: boolean;
  onToggle: () => void;
}

const DeckCard = ({ deck, selected, onToggle }: DeckCardProps) => {
  const getMoodGradient = (mood: string) => {
    switch (mood) {
      case 'freaky':
        return 'from-crimson-deep via-crimson-vivid to-crimson-glow';
      case 'real_talk':
        return 'from-secondary via-crimson-vivid to-primary';
      case 'love_drunk':
        return 'from-primary via-crimson-deep to-secondary';
      default:
        return 'from-primary to-secondary';
    }
  };

  return (
    <Card
      onClick={onToggle}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 card-shadow",
        "border-2 p-6 min-h-[180px]",
        selected 
          ? "border-secondary bg-card scale-105" 
          : "border-border hover:border-secondary/50 bg-card/50"
      )}
    >
      {/* Gradient overlay when selected */}
      {selected && (
        <div 
          className={cn(
            "absolute inset-0 opacity-10 bg-gradient-to-br",
            getMoodGradient(deck.mood)
          )}
        />
      )}
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="font-display text-2xl mb-2 text-foreground">
            {deck.name}
          </h3>
          <p className="font-card text-sm text-muted-foreground leading-relaxed">
            {deck.description}
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-ui">
            {deck.cardCount} cards
          </span>
          
          {selected && (
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
              <svg 
                className="w-3 h-3 text-foreground" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DeckCard;

import { Card as CardType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: CardType;
  isFavorite: boolean;
  onChoice?: (choice: string) => void;
  onFavorite: () => void;
  responseInputComponent?: React.ReactNode;
  isFlipping?: boolean;
}

const GameCard = ({ card, isFavorite, onChoice, onFavorite, responseInputComponent, isFlipping = false }: GameCardProps) => {
  const renderCardContent = () => {
    switch (card.subtype) {
      case 'this_or_that':
        return (
          <div className="space-y-8">
            <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground">
              {card.text}
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => onChoice?.('A')}
                variant="outline"
                className="h-auto py-5 px-6 text-lg font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group"
              >
                <span className="group-hover:text-glow-soft transition-all">{card.choiceA}</span>
              </Button>
              <div className="flex items-center justify-center">
                <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
              </div>
              <Button
                onClick={() => onChoice?.('B')}
                variant="outline"
                className="h-auto py-5 px-6 text-lg font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group"
              >
                <span className="group-hover:text-glow-soft transition-all">{card.choiceB}</span>
              </Button>
            </div>
          </div>
        );
      
      case 'say_sip_strip':
        return (
          <div className="space-y-8">
            <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground">
              {card.text}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Say it', icon: '💬' },
                { label: 'Sip it', icon: '🍷' },
                { label: 'Strip it', icon: '🔥' }
              ].map(({ label, icon }) => (
                <Button
                  key={label}
                  onClick={() => onChoice?.(label)}
                  variant="outline"
                  className="h-20 flex-col gap-1 text-sm font-card border-2 border-crimson-vivid/50 hover:border-crimson-glow hover:bg-crimson-vivid/10 text-foreground transition-all duration-300 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                  <span className="group-hover:text-crimson-glow transition-colors">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        );
      
      case 'open_ended':
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center min-h-[140px]">
              <p className="font-card text-2xl md:text-3xl leading-relaxed text-center text-foreground px-2">
                {card.text}
              </p>
            </div>
            {responseInputComponent}
          </div>
        );
    }
  };

  const getSpiceColor = () => {
    switch (card.spice) {
      case 'soft': return 'text-teal bg-teal/10 border-teal/30';
      case 'standard': return 'text-gold bg-gold/10 border-gold/30';
      case 'spicy': return 'text-crimson-glow bg-crimson-vivid/10 border-crimson-vivid/30';
      default: return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  return (
    <div className="relative w-full max-w-2xl card-flip-container">
      {/* Glow effect behind card */}
      <div className="absolute inset-4 bg-crimson-vivid/10 rounded-3xl blur-2xl" />
      
      <div className={cn(
        "relative card-flip",
        isFlipping && "flipping"
      )}>
        {/* Card back (shown during flip) */}
        <div className="card-flip-back glass rounded-2xl border border-border/50 p-8 shadow-elevated">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-crimson-vivid/20 via-background to-crimson-deep/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-crimson-vivid/20 flex items-center justify-center border-2 border-crimson-vivid/40">
              <span className="font-display text-3xl text-crimson-glow">LQ</span>
            </div>
          </div>
          {/* Decorative corner accents on back */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-crimson-vivid/30 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-crimson-vivid/30 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-crimson-vivid/30 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-crimson-vivid/30 rounded-br-2xl" />
        </div>
        
        {/* Card front */}
        <div className="card-flip-front relative glass rounded-2xl border border-border/50 p-8 shadow-elevated">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-crimson-vivid/30 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-crimson-vivid/30 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-crimson-vivid/30 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-crimson-vivid/30 rounded-br-2xl" />
        
        {/* Wax seal watermark */}
        <div className="absolute bottom-6 right-6 opacity-10">
          <div className="w-14 h-14 rounded-full bg-crimson-vivid flex items-center justify-center">
            <span className="font-display text-lg text-white">LQ</span>
          </div>
        </div>
        
        {/* Favorite button */}
        <button
          onClick={onFavorite}
          className={cn(
            "absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 z-10 group",
            isFavorite 
              ? "text-crimson-glow bg-crimson-vivid/20" 
              : "text-muted-foreground hover:text-crimson-glow hover:bg-crimson-vivid/10"
          )}
        >
          <Heart className={cn(
            "w-6 h-6 transition-transform group-hover:scale-110",
            isFavorite && "fill-current"
          )} />
        </button>
        
        {/* Spice indicator */}
        <div className={cn(
          "absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border",
          getSpiceColor()
        )}>
          {card.spice === 'spicy' && <Sparkles className="w-3 h-3 inline mr-1" />}
          {card.spice}
        </div>
        
          {/* Card content */}
          <div className="mt-12 mb-4">
            {renderCardContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
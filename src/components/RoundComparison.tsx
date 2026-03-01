import { Button } from '@/components/ui/button';
import { ChevronRight, Heart } from 'lucide-react';
import { Card as CardType } from '@/types/game';

interface PlayerResponse {
  playerName: string;
  choice?: string;
  choiceLabel?: string;
  responseText?: string;
}

interface RoundComparisonProps {
  card: CardType;
  player1Response: PlayerResponse;
  player2Response: PlayerResponse;
  onContinue: () => void;
}

const RoundComparison = ({ card, player1Response, player2Response, onContinue }: RoundComparisonProps) => {
  const isSameChoice = player1Response.choice === player2Response.choice;

  const getDisplayText = (resp: PlayerResponse) => {
    if (resp.choiceLabel) return resp.choiceLabel;
    if (resp.responseText) return `"${resp.responseText}"`;
    return resp.choice || '—';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md w-full animate-slide-up">
        {/* Card question */}
        <div className="glass rounded-xl border border-border/50 p-5 w-full">
          <p className="font-card text-lg text-foreground leading-relaxed">{card.text}</p>
        </div>

        {/* Side-by-side responses */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {[player1Response, player2Response].map((resp, i) => (
            <div
              key={i}
              className="glass rounded-xl border border-border/50 p-4 flex flex-col items-center gap-3 relative overflow-hidden"
            >
              {/* Top accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${i === 0 ? 'bg-crimson-vivid' : 'bg-purple'}`} />
              
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {resp.playerName}
              </p>
              <p className="font-card text-base text-foreground leading-snug">
                {getDisplayText(resp)}
              </p>
            </div>
          ))}
        </div>

        {/* Match indicator */}
        {player1Response.choice && player2Response.choice && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            isSameChoice 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-muted text-muted-foreground border border-border/50'
          }`}>
            {isSameChoice ? (
              <>
                <Heart className="w-4 h-4 fill-current" />
                You're in sync!
              </>
            ) : (
              'Different choices — time to discuss! 💬'
            )}
          </div>
        )}

        {/* Continue button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="h-14 px-8 text-lg bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow group"
        >
          Next Card
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default RoundComparison;

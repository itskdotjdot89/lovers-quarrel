import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Heart, Sparkles, Loader2 } from 'lucide-react';
import { Card as CardType } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [synopsis, setSynopsis] = useState<string | null>(null);

  const getDisplayText = (resp: PlayerResponse) => {
    if (resp.choiceLabel) return resp.choiceLabel;
    if (resp.responseText) return `"${resp.responseText}"`;
    return resp.choice || '—';
  };

  const getResponseText = (resp: PlayerResponse) => {
    if (resp.responseText) return resp.responseText;
    if (resp.choiceLabel) return resp.choiceLabel;
    return resp.choice || '';
  };

  // Auto-trigger analysis when component mounts
  useEffect(() => {
    const fetchInsights = async () => {
      setSynopsis(null);
      setIsAnalyzing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.functions.invoke('analyze-response', {
          body: {
            couplesMode: true,
            cardId: card.id,
            questionText: card.text,
            deckId: card.deckId,
            player1Response: getResponseText(player1Response),
            player2Response: getResponseText(player2Response),
            player1Name: player1Response.playerName,
            player2Name: player2Response.playerName,
          }
        });

        if (error) throw error;
        setSynopsis(data.analysis);
      } catch (error) {
        console.error('Couples analysis error:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchInsights();
  }, [card.id, player1Response.choice, player1Response.responseText, player2Response.choice, player2Response.responseText]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-6 text-center max-w-md w-full animate-slide-up mx-auto my-auto min-h-full justify-center py-8">
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

          {/* AI Synopsis */}
          <div className="w-full glass rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-crimson-glow" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Insights</span>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing both answers...
              </div>
            ) : synopsis ? (
              <p className="text-sm text-foreground leading-relaxed">{synopsis}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Could not generate insights.</p>
            )}
          </div>

          <Button
            onClick={onContinue}
            size="lg"
            className="h-14 px-8 text-lg w-full bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow group"
          >
            Next Card
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default RoundComparison;

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

interface PassThePhoneProps {
  nextPlayerName: string;
  onReady: () => void;
}

const PassThePhone = ({ nextPlayerName, onReady }: PassThePhoneProps) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      onReadyRef.current();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-lg font-card">Pass the phone to</p>
          <h2 className="text-4xl font-display text-foreground">{nextPlayerName}</h2>
        </div>

        {countdown !== null ? (
          <div className="text-6xl font-bold text-primary animate-bounce">
            {countdown}
          </div>
        ) : (
          <Button
            onClick={() => setCountdown(3)}
            size="lg"
            className="h-14 px-10 text-lg bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow"
          >
            I'm {nextPlayerName} — Ready!
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Don't peek at your partner's answers! 👀
        </p>
      </div>
    </div>
  );
};

export default PassThePhone;

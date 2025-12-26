import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

interface AgeGateProps {
  onAccept: () => void;
}

const AgeGate = ({ onAccept }: AgeGateProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    onAccept();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-8 bg-card border-2 border-secondary card-shadow">
        <div className="flex flex-col items-center space-y-6 text-center">
          <img 
            src={loversQuarrelLogo} 
            alt="Lovers Quarrel" 
            className="w-32 h-auto logo-glow"
          />
          
          <h1 className="font-display text-3xl text-foreground">
            Lovers' Quarrel
          </h1>
          
          <div className="space-y-4 font-card text-foreground/90">
            <p className="text-lg leading-relaxed">
              This game contains adult themes and explicit content designed for mature audiences.
            </p>
            
            <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold text-foreground">Age Verification</p>
              <p>You must be 18 years or older to continue.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold text-foreground">Consent & Safety</p>
              <p>
                Play requires mutual consent. All players should feel comfortable 
                and respected. You can pass on any card at any time.
              </p>
            </div>
          </div>
          
          <div className="w-full space-y-3 pt-4">
            <Button
              onClick={handleAccept}
              className="w-full bg-secondary hover:bg-secondary/90 text-foreground font-semibold text-lg h-14"
            >
              I am 18+ and I understand
            </Button>
            
            <a
              href="about:blank"
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Exit
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgeGate;

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Heart, X } from 'lucide-react';

interface PaywallOverlayProps {
  onClose?: () => void;
  cardsViewed: number;
}

const PaywallOverlay = ({ onClose, cardsViewed }: PaywallOverlayProps) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />
      
      {/* Content */}
      <div className="relative glass rounded-3xl p-8 max-w-md w-full border-2 border-primary/30 animate-scale-in">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        
        {/* Crown icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-gold animate-pulse" />
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-display text-center text-foreground mb-2">
          You're on a Roll!
        </h2>
        
        {/* Subtitle */}
        <p className="text-center text-muted-foreground mb-6">
          You've explored <span className="text-primary font-semibold">{cardsViewed} cards</span> together. 
          Unlock unlimited access to keep the conversation going.
        </p>
        
        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            'Unlimited cards from all decks',
            'AI-powered relationship insights',
            'New cards added quarterly',
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Heart className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* CTA Button */}
        <Button
          onClick={handleSubscribe}
          size="lg"
          className="w-full h-14 text-lg bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid btn-glow"
        >
          <Crown className="w-5 h-5 mr-2" />
          Try Free, then $4.99/month
        </Button>
        
        {/* Subscription disclosure */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Subscription required. $4.99/month after 7-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default PaywallOverlay;

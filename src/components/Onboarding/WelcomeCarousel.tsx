import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Flame, MessageCircle, Users, ChevronRight, Sparkles } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

interface WelcomeCarouselProps {
  onComplete: () => void;
}

const screens = [
  {
    icon: Heart,
    title: "Welcome to Lovers' Quarrel",
    subtitle: "The card game that brings you closer",
    description: "Deep conversations, playful moments, and genuine connection through thoughtfully crafted prompts.",
    accent: 'crimson'
  },
  {
    icon: MessageCircle,
    title: "Choose Your Mood",
    subtitle: "Three unique decks to explore",
    description: "From Freaky and flirty to Real Talk and Love Drunk - mix and match to set the perfect vibe.",
    accent: 'purple'
  },
  {
    icon: Flame,
    title: "Set Your Heat Level",
    subtitle: "You're always in control",
    description: "Choose Soft, Standard, or Spicy intensity. Pass on any card at any time.",
    accent: 'gold'
  },
  {
    icon: Users,
    title: "Play Your Way",
    subtitle: "Together or apart",
    description: "Perfect for solo play, in-person dates, or long-distance connections.",
    accent: 'teal'
  }
];

const WelcomeCarousel = ({ onComplete }: WelcomeCarouselProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(prev => prev - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diff = touchEndX.current - touchStartX.current;
    setSwipeOffset(diff);
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }

    setSwipeOffset(0);
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-crimson-vivid/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div 
        className="relative w-full max-w-md pb-16"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main card with glassmorphism */}
        <div 
          className="glass rounded-2xl p-8 space-y-8 shadow-elevated transition-transform duration-200 animate-scale-in"
          style={{ transform: `translateX(${swipeOffset * 0.3}px)` }}
        >
          {/* Icon/Logo section */}
          <div className="relative">
            {currentScreen === 0 ? (
              <div className="relative">
                <img 
                  src={loversQuarrelLogo} 
                  alt="Lovers' Quarrel" 
                  className="w-36 h-auto mx-auto logo-glow float"
                />
                <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-crimson-glow animate-pulse" />
              </div>
            ) : (
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-crimson-vivid/30 to-purple/20 rounded-2xl blur-xl" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-muted to-card flex items-center justify-center border border-border/50">
                  <Icon className="w-12 h-12 text-crimson-glow" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4 text-center">
            <h1 className="text-3xl md:text-4xl font-display text-glow-soft text-foreground">
              {screen.title}
            </h1>
            <p className="text-lg font-semibold text-crimson-soft">
              {screen.subtitle}
            </p>
            <p className="text-muted-foreground font-card text-lg leading-relaxed">
              {screen.description}
            </p>
          </div>

          {/* Progress */}
          <ProgressIndicator currentStep={currentScreen} totalSteps={screens.length} />

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid transition-all duration-300 btn-glow group"
            >
              {currentScreen < screens.length - 1 ? (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  Let's Begin
                  <Sparkles className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </Button>

            {currentScreen > 0 && (
              <Button
                variant="ghost"
                onClick={handlePrevious}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
            )}
          </div>
        </div>
        
        {/* Skip button - now properly positioned within padded container */}
        {currentScreen < screens.length - 1 && (
          <Button
            variant="ghost"
            onClick={onComplete}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip intro
          </Button>
        )}
      </div>
    </div>
  );
};

export default WelcomeCarousel;
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Flame, MessageCircle, Users } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';

interface WelcomeCarouselProps {
  onComplete: () => void;
}

const screens = [
  {
    icon: Heart,
    title: "Welcome to Lovers' Quarrel",
    subtitle: "The card game that brings you closer",
    description: "Deep conversations, playful moments, and genuine connection through thoughtfully crafted prompts."
  },
  {
    icon: MessageCircle,
    title: "Choose Your Mood",
    subtitle: "Three unique decks to explore",
    description: "From Freaky and flirty to Real Talk and Love Drunk - mix and match to set the perfect vibe for your moment together."
  },
  {
    icon: Flame,
    title: "Set Your Comfort Level",
    subtitle: "You're always in control",
    description: "Choose Soft, Standard, or Spicy intensity. Pass on any card at any time - your boundaries matter most."
  },
  {
    icon: Users,
    title: "Play Your Way",
    subtitle: "In-person or long-distance",
    description: "Individual plan for passing the device, or Couple Bundle for remote play. You can even play solo to prepare for date night."
  }
];

const WelcomeCarousel = ({ onComplete }: WelcomeCarouselProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const screen = screens[currentScreen];
  const Icon = screen.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {screen.title}
          </h1>
          <p className="text-lg font-semibold text-foreground">
            {screen.subtitle}
          </p>
          <p className="text-muted-foreground">
            {screen.description}
          </p>
        </div>

        <ProgressIndicator currentStep={currentScreen} totalSteps={screens.length} />

        <Button
          onClick={handleNext}
          className="w-full h-12 text-lg"
        >
          {currentScreen < screens.length - 1 ? 'Next' : "Let's Start"}
        </Button>

        {currentScreen > 0 && (
          <Button
            variant="ghost"
            onClick={() => setCurrentScreen(prev => prev - 1)}
            className="w-full"
          >
            Back
          </Button>
        )}
      </Card>
    </div>
  );
};

export default WelcomeCarousel;

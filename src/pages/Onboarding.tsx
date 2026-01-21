import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeCarousel from '@/components/Onboarding/WelcomeCarousel';
import AgeGate from '@/components/AgeGate';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import loversQuarrelLogo from '@/assets/lovers-quarrel-logo.png';

type OnboardingStep = 'welcome' | 'age-gate' | 'trial-prompt';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('welcome');

  const handleWelcomeComplete = () => {
    setStep('age-gate');
  };

  const handleAgeGateAccept = () => {
    localStorage.setItem('lq_age_verified', 'true');
    setStep('trial-prompt');
  };

  const handleStartTrial = () => {
    navigate('/auth?from=onboarding');
  };

  if (step === 'welcome') {
    return <WelcomeCarousel onComplete={handleWelcomeComplete} />;
  }

  if (step === 'age-gate') {
    return <AgeGate onAccept={handleAgeGateAccept} />;
  }

  const features = [
    'All 3 decks with 600+ cards',
    'Unlimited AI response analysis',
    'Solo, date night & long-distance modes',
    'Save favorites across devices',
    'New cards added quarterly'
  ];

  // Trial Prompt
  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-crimson-vivid/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative w-full max-w-md glass rounded-2xl overflow-hidden shadow-elevated animate-slide-up">
        {/* Shimmer effect on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-crimson-glow to-transparent shimmer" />
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <img 
              src={loversQuarrelLogo} 
              alt="Lovers' Quarrel" 
              className="w-28 h-auto mx-auto logo-glow"
            />
            <div>
              <h1 className="text-3xl font-display text-foreground text-glow-soft mb-2">
                Start Your Journey
              </h1>
              <p className="text-lg text-crimson-soft font-semibold">
                7-Day Free Trial
              </p>
            </div>
          </div>
          
          {/* Features list */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-6 h-6 rounded-full bg-crimson-vivid/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-crimson-glow" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing note */}
          <div className="bg-muted/30 rounded-xl p-4 text-center mb-8 border border-border/50">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">No charge today.</span>
              {' '}Cancel anytime. After 7 days, just $5-8/month.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleStartTrial}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-crimson-vivid to-crimson-deep hover:from-crimson-glow hover:to-crimson-vivid transition-all duration-300 btn-glow pulse-glow group"
            >
              Create Account
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full h-12 text-base border-border/50 hover:border-crimson-vivid/50 hover:bg-crimson-vivid/10 transition-all"
            >
              Already have an account? Sign In
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
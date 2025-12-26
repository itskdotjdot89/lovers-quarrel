import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeCarousel from '@/components/Onboarding/WelcomeCarousel';
import AgeGate from '@/components/AgeGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
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

  // Trial Prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <img 
            src={loversQuarrelLogo} 
            alt="Lovers' Quarrel" 
            className="w-32 h-auto mx-auto logo-glow"
          />
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Start Your 7-Day Free Trial
          </CardTitle>
          <CardDescription className="text-base">
            Experience everything Lovers' Quarrel has to offer with no charge today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {[
              'All 3 decks with 600+ cards',
              'Unlimited AI response analysis',
              'Solo, date night & long-distance modes',
              'Save favorites across devices',
              'New cards added quarterly'
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">No charge today.</span>
              {' '}Cancel anytime during your trial. After 7 days, just $5-8/month.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleStartTrial}
              className="w-full h-12 text-lg"
            >
              Create Account & Start Trial
            </Button>

            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full h-12 text-lg"
            >
              Already have an account? Sign In
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, User, Loader2, RotateCcw, Crown, Settings2, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { Capacitor } from '@capacitor/core';
import { Skeleton } from '@/components/ui/skeleton';

const features = [
  'All 3 decks (600 cards)',
  'Unlimited AI analyses',
  'Solo & date night modes',
  'Long-distance mode',
  'Favorites & custom sessions',
  'New cards quarterly'
];

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const fromOnboarding = searchParams.get('from') === 'onboarding';
  
  const { checkSubscription, isPremium: isAlreadyPremium } = useSubscription();
  const { 
    isNative, 
    isLoading: rcLoading, 
    offerings, 
    currentPrice,
    trialDuration,
    isPremium: rcPremium,
    isTrialing,
    purchase, 
    restore,
    showPaywall,
    showCustomerCenter,
  } = useRevenueCat();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate('/auth');
      }
    });
  }, [navigate]);

  const handleBack = () => {
    if (fromOnboarding) {
      navigate('/auth?from=onboarding');
    } else {
      navigate('/home');
    }
  };

  // Show RevenueCat Paywall on native
  const handleShowPaywall = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const result = await showPaywall();
      
      if (result.purchased || result.restored) {
        await checkSubscription();
        toast({
          title: 'Welcome to Premium!',
          description: result.restored 
            ? 'Your subscription has been restored.' 
            : 'Your subscription is now active.'
        });
        navigate('/home');
      } else if (result.cancelled) {
        console.log('User cancelled paywall');
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Paywall error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to show subscription options. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // On native, use RevenueCat paywall or direct purchase
      if (isNative) {
        // Try paywall first - it handles the full purchase flow
        const result = await showPaywall();
        
        if (result.purchased || result.restored) {
          await checkSubscription();
          toast({
            title: 'Welcome to Premium!',
            description: result.restored 
              ? 'Your subscription has been restored.' 
              : 'Your subscription is now active.'
          });
          navigate('/home');
          return;
        }
        
        // If paywall fails but we have offerings, try direct purchase
        if (!result.success && offerings.length > 0) {
          const success = await purchase(offerings[0]);
          if (success) {
            await checkSubscription();
            toast({
              title: 'Welcome to Premium!',
              description: 'Your subscription is now active.'
            });
            navigate('/home');
          }
        }
        return;
      }

      // On web, use Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id: 'price_1STYUuLisf4T9XH8vUJvgxrt' }
      });

      if (error) throw error;

      if (data?.url) {
        if (fromOnboarding) {
          window.location.href = data.url;
          localStorage.setItem('lq_trial_started', 'true');
        } else {
          window.open(data.url, '_blank');
        }
        
        toast({
          title: 'Redirecting to Checkout',
          description: 'Complete your payment to start your 7-day free trial!'
        });
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Customer Center for managing subscription
  const handleManageSubscription = async () => {
    if (isNative) {
      setLoading(true);
      try {
        const success = await showCustomerCenter();
        if (!success) {
          // Fallback: navigate to settings
          navigate('/manage-subscription');
        }
      } catch (error) {
        console.error('Customer Center error:', error);
        navigate('/manage-subscription');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/manage-subscription');
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await restore();
      if (success) {
        await checkSubscription();
        toast({
          title: 'Purchases Restored',
          description: 'Your subscription has been restored.'
        });
        navigate('/home');
      } else {
        toast({
          variant: 'destructive',
          title: 'No Purchases Found',
          description: 'No previous purchases were found to restore.'
        });
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: 'Unable to restore purchases. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get display price - use RevenueCat price on native, fallback to $4.99
  const displayPrice = currentPrice || '$4.99';
  const displayTrialDuration = trialDuration || '7 days';
  const isPageLoading = rcLoading && isNative;
  const userIsPremium = isAlreadyPremium || rcPremium;

  // If user is already premium, show management option
  if (userIsPremium && !isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/home')}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-6">
              <Crown className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">You're Premium!</h1>
            <p className="text-muted-foreground mb-2">
              {isTrialing 
                ? 'You are currently in your free trial period.'
                : 'Thank you for being a Premium subscriber.'
              }
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Enjoy unlimited access to all features.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleManageSubscription}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
              
              <Button 
                onClick={() => navigate('/home')}
                className="w-full"
              >
                Start Playing
              </Button>
            </div>
            
            <div className="flex justify-center gap-4 mt-8 text-sm">
              <Link to="/terms" className="text-primary hover:underline">Terms</Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back/Close Button */}
        <div className="flex justify-start mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            {fromOnboarding ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </Button>
        </div>

        <div className="text-center mb-8">
          {fromOnboarding && (
            <p className="text-sm text-muted-foreground mb-4">Step 2 of 3</p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Start your 7-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="relative transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Premium</CardTitle>
              </div>
              <CardDescription>Unlock everything</CardDescription>
              
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  {isPageLoading ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{displayPrice}</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  7-day free trial included
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={loading || isPageLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  fromOnboarding ? 'Start Free Trial & Play' : 'Start 7-Day Free Trial'
                )}
              </Button>

              {isNative && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRestore}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore Purchases
                </Button>
              )}

              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* App Store Compliance Text */}
        <div className="text-center mt-8 text-xs text-muted-foreground max-w-md mx-auto space-y-3">
          {isNative && (
            <p className="text-[10px] leading-relaxed">
              Payment will be charged to your Apple ID account at the confirmation of purchase. 
              Subscription automatically renews unless it is canceled at least 24 hours before 
              the end of the current period. Your account will be charged for renewal within 
              24 hours prior to the end of the current period. You can manage and cancel your 
              subscriptions by going to your account settings on the App Store after purchase.
            </p>
          )}
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Use
            </Link>
            <span>•</span>
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

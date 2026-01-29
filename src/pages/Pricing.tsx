import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, User, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useRevenueCat } from '@/hooks/useRevenueCat';

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
  
  const { checkSubscription } = useSubscription();
  const { 
    isNative, 
    isLoading: rcLoading, 
    offerings, 
    currentPrice, 
    purchase, 
    restore 
  } = useRevenueCat();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate('/auth');
      }
    });
  }, [navigate]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // On native, use RevenueCat
      if (isNative && offerings.length > 0) {
        const success = await purchase(offerings[0]);
        if (success) {
          await checkSubscription();
          toast({
            title: 'Welcome to Premium!',
            description: 'Your subscription is now active.'
          });
          navigate('/home');
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
  const isPageLoading = rcLoading && isNative;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
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
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
          <p className="mt-2">
            Cancel from your{' '}
            <Link to="/settings" className="text-primary hover:underline">
              account settings
            </Link>
            .
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/terms" className="text-primary hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, User, RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRevenueCat, PAYWALL_RESULT } from '@/hooks/useRevenueCat';
import { useSubscription } from '@/contexts/SubscriptionContext';

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
  
  const { 
    isNative, 
    isReady: revenueCatReady, 
    isLoading: revenueCatLoading,
    login: revenueCatLogin,
    purchasePackage,
    offerings,
    restorePurchases: revenueCatRestore,
    error: revenueCatError
  } = useRevenueCat();
  
  const { checkSubscription } = useSubscription();

  // Get the current offering's available package
  const currentPackage = offerings?.current?.availablePackages?.[0];
  const productPrice = currentPackage?.product?.priceString;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) {
        navigate('/auth');
      } else if (isNative && revenueCatReady) {
        revenueCatLogin(user.id);
      }
    });
  }, [navigate, isNative, revenueCatReady, revenueCatLogin]);

  const handleNativePurchase = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!currentPackage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No subscription packages available. Please try again later.'
      });
      return;
    }

    setLoading(true);

    try {
      const result = await purchasePackage(currentPackage);
      
      if (result) {
        toast({
          title: 'Purchase Successful!',
          description: 'Welcome to Premium! Enjoy all features.'
        });
        await checkSubscription();
        navigate('/home');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      // User cancelled is not an error
      if (err.code === 'PURCHASE_CANCELLED') {
        toast({
          title: 'Purchase Cancelled',
          description: 'No worries, you can subscribe anytime.'
        });
        return;
      }
      
      console.error('Native purchase error:', error);
      const errorMessage = err.message || 'Failed to complete purchase';
      toast({
        variant: 'destructive',
        title: 'Purchase Error',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const customerInfo = await revenueCatRestore();
      
      if (customerInfo) {
        const hasEntitlement = customerInfo.entitlements?.active?.['lovers_quarrel_pro'];
        
        if (hasEntitlement) {
          toast({
            title: 'Purchases Restored',
            description: 'Your subscription has been restored.'
          });
          await checkSubscription();
          navigate('/home');
        } else {
          toast({
            title: 'No Purchases Found',
            description: 'No previous purchases were found to restore.'
          });
        }
      } else {
        toast({
          title: 'No Purchases Found',
          description: 'No previous purchases were found to restore.'
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore purchases';
      toast({
        variant: 'destructive',
        title: 'Restore Error',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSubscribe = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
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

  const handleSubscribe = () => {
    if (isNative) {
      handleNativePurchase();
    } else {
      handleStripeSubscribe();
    }
  };

  const isPageLoading = loading || revenueCatLoading || (isNative && !revenueCatReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {fromOnboarding && !isNative && (
            <p className="text-sm text-muted-foreground mb-4">Step 2 of 3</p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isNative ? 'Upgrade to Premium' : 'Choose Your Plan'}
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            {isNative 
              ? 'Unlock all features and content'
              : 'Start your 7-day free trial. Cancel anytime.'
            }
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
              
              {/* Show price from StoreKit on iOS, hardcoded on web */}
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  {isNative && productPrice ? (
                    <span className="text-4xl font-bold">{productPrice}</span>
                  ) : !isNative ? (
                    <>
                      <span className="text-4xl font-bold">$5</span>
                      <span className="text-muted-foreground">/month</span>
                    </>
                  ) : (
                    <span className="text-2xl text-muted-foreground">Loading price...</span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={isPageLoading}
              >
                {isPageLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : isNative ? (
                  'Subscribe'
                ) : (
                  fromOnboarding ? 'Start Free Trial & Play' : 'Start 7-Day Free Trial'
                )}
              </Button>

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
          {isNative ? (
            <>
              <Button
                variant="ghost"
                onClick={handleRestore}
                disabled={isPageLoading}
                className="mb-4"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Purchases
              </Button>
              <p className="mb-2">
                Payment will be charged to your Apple ID account at confirmation of purchase.
              </p>
              <p className="mb-2">
                Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
              </p>
              <p className="mb-4">
                Manage subscriptions in iOS Settings → your name → Subscriptions.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Use
                </Link>
                <span>•</span>
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pricing;

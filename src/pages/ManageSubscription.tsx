import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ExternalLink, Loader2, Crown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useSubscription } from '@/contexts/SubscriptionContext';

const ManageSubscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();
  const { 
    isPremium: rcPremium, 
    isTrialing: rcTrialing,
    showCustomerCenter,
    isLoading: rcLoading 
  } = useRevenueCat();
  const { 
    subscribed: stripePremium, 
    subscription_end,
    status: stripeStatus,
    loading: subLoading 
  } = useSubscription();

  const isPremium = isNative ? rcPremium : stripePremium;
  const isTrialing = isNative ? rcTrialing : stripeStatus === 'trialing';
  const isLoading = isNative ? rcLoading : subLoading;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  // Handle RevenueCat Customer Center for iOS
  const handleManageNative = async () => {
    setLoading(true);
    try {
      const success = await showCustomerCenter();
      if (!success) {
        toast({
          variant: 'destructive',
          title: 'Unable to Open',
          description: 'Please manage your subscription in Settings > Apple ID > Subscriptions'
        });
      }
    } catch (error) {
      console.error('Customer Center error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to open subscription management.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Stripe Customer Portal for Web
  const handleManageWeb = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Opening Stripe Portal',
          description: 'Manage your subscription and payment methods'
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to open customer portal'
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'canceled': return 'bg-red-500';
      case 'past_due': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    if (isTrialing) return 'TRIAL';
    if (isPremium) return 'ACTIVE';
    return 'INACTIVE';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              You don't have an active subscription yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Plans
            </Button>
            <Button onClick={() => navigate('/home')} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>

        {/* Premium Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Premium Subscription</CardTitle>
              </div>
              <Badge className={getStatusColor(isTrialing ? 'trialing' : 'active')}>
                {getStatusLabel()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">Lovers' Quarrel Premium</p>
              <p className="text-muted-foreground">
                {isTrialing 
                  ? 'You are currently in your free trial period.'
                  : 'Full access to all premium features.'
                }
              </p>
            </div>

            {isTrialing && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm font-medium text-blue-400">Free Trial Active</p>
                <p className="text-sm text-muted-foreground">
                  Enjoy full access during your trial period.
                </p>
              </div>
            )}

            {!isNative && subscription_end && !isTrialing && (
              <div className="text-sm text-muted-foreground">
                Next billing date: {new Date(subscription_end).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              {isNative 
                ? 'Manage your subscription through the App Store.'
                : 'Manage your subscription, payment methods, and billing.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isNative ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageNative}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage in App Store
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageWeb}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Manage Payment & Billing
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground">
          {isNative 
            ? 'Subscriptions are managed through your Apple ID account settings.'
            : 'You will be redirected to Stripe to manage your subscription.'
          }
        </p>
      </div>
    </div>
  );
};

export default ManageSubscription;

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { REVENUECAT_CONFIG } from '@/lib/revenuecat';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
  status?: string;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionStatus {
  checkSubscription: () => Promise<void>;
  isPremium: boolean;
  isNative: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    loading: true
  });

  // Check if running on native platform
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    setIsNative(platform === 'ios' || platform === 'android');
  }, []);

  const checkNativeSubscription = useCallback(async (): Promise<void> => {
    try {
      // Dynamically import RevenueCat SDK
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      
      const { customerInfo } = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements?.active?.[REVENUECAT_CONFIG.entitlementId];
      
      if (entitlement) {
        setSubscriptionStatus({
          subscribed: true,
          product_id: entitlement.productIdentifier || 'revenuecat_premium',
          subscription_end: entitlement.expirationDate || null,
          status: 'active',
          loading: false
        });
      } else {
        // No active entitlement - fall back to Stripe check
        await checkStripeSubscription();
      }
    } catch (error) {
      console.error('[SubscriptionContext] RevenueCat check failed, falling back to Stripe:', error);
      // Fall back to Stripe check on error
      await checkStripeSubscription();
    }
  }, []);

  const checkStripeSubscription = useCallback(async (): Promise<void> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        loading: false
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus({
          subscribed: false,
          product_id: null,
          subscription_end: null,
          loading: false
        });
        return;
      }

      setSubscriptionStatus({
        subscribed: data.subscribed || false,
        product_id: data.product_id,
        subscription_end: data.subscription_end,
        status: data.status,
        loading: false
      });
    } catch (error) {
      console.error('Error in checkSubscription:', error);
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        loading: false
      });
    }
  }, []);

  const checkSubscription = useCallback(async (): Promise<void> => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        loading: false
      });
      return;
    }

    // For native platforms, check RevenueCat first, then fall back to Stripe
    if (isNative) {
      await checkNativeSubscription();
    } else {
      // For web, check Stripe directly
      await checkStripeSubscription();
    }
  }, [isNative, checkNativeSubscription, checkStripeSubscription]);

  useEffect(() => {
    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        checkSubscription();
      } else {
        setSubscriptionStatus({
          subscribed: false,
          product_id: null,
          subscription_end: null,
          loading: false
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkSubscription();
      } else {
        setSubscriptionStatus({
          subscribed: false,
          product_id: null,
          subscription_end: null,
          loading: false
        });
      }
    });

    // Check subscription status every minute
    const interval = setInterval(() => {
      if (user) {
        checkSubscription();
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [user, checkSubscription]);

  const isPremium = subscriptionStatus.subscribed;

  return (
    <SubscriptionContext.Provider
      value={{
        ...subscriptionStatus,
        checkSubscription,
        isPremium,
        isNative
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

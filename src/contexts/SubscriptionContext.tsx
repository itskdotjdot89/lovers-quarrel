import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { checkEntitlement, initializeRevenueCat, loginRevenueCat } from '@/lib/revenuecat';

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
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    loading: true
  });

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

    const isNative = Capacitor.isNativePlatform();

    // On native platforms, use RevenueCat for subscription checks
    if (isNative) {
      try {
        console.log('[SubscriptionContext] Native platform detected, using RevenueCat');
        
        // Initialize RevenueCat if needed
        const initialized = await initializeRevenueCat(currentUser.id);
        if (initialized) {
          await loginRevenueCat(currentUser.id);
        }
        
        const hasAccess = await checkEntitlement();
        console.log('[SubscriptionContext] RevenueCat entitlement check:', hasAccess);
        
        setSubscriptionStatus({
          subscribed: hasAccess,
          product_id: hasAccess ? 'revenuecat_premium' : null,
          subscription_end: null,
          status: hasAccess ? 'active' : undefined,
          loading: false
        });
        return;
      } catch (error) {
        console.error('[SubscriptionContext] RevenueCat check failed, falling back to Stripe:', error);
        // Fall through to Stripe check as backup
      }
    }

    // On web or as fallback, use Stripe edge function
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
        isPremium
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

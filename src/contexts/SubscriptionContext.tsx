import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { initializeRevenueCat, checkEntitlement, loginRevenueCat } from '@/lib/revenuecat';

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

// Retry helper with exponential backoff
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    product_id: null,
    subscription_end: null,
    loading: true
  });
  const checkInProgress = useRef(false);
  const lastCheckTime = useRef<number>(0);

  const isNative = Capacitor.isNativePlatform();
  const CHECK_COOLDOWN = 30000; // 30 seconds minimum between checks

  const checkSubscription = useCallback(async (): Promise<void> => {
    // Prevent concurrent checks and rate limit
    const now = Date.now();
    if (checkInProgress.current || (now - lastCheckTime.current) < CHECK_COOLDOWN) {
      return;
    }
    
    checkInProgress.current = true;
    lastCheckTime.current = now;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        loading: false
      });
      checkInProgress.current = false;
      return;
    }

    try {
      // Always check backend first (handles whitelist + Stripe)
      console.log('[SubscriptionContext] Checking via edge function first');
      
      let backendSubscribed = false;
      try {
        const data = await retryWithBackoff(async () => {
          const response = await supabase.functions.invoke('check-subscription');
          if (response.error) {
            throw new Error(response.error.message || 'Failed to check subscription');
          }
          return response.data;
        });

        if (data?.subscribed) {
          console.log('[SubscriptionContext] Subscribed via backend (whitelist/Stripe)');
          setSubscriptionStatus({
            subscribed: true,
            product_id: data.product_id || null,
            subscription_end: data.subscription_end || null,
            status: data.status,
            loading: false
          });
          checkInProgress.current = false;
          return;
        }
      } catch (backendError) {
        console.warn('[SubscriptionContext] Backend check failed, continuing...', backendError);
      }

      // If not subscribed via backend AND on native, check RevenueCat
      if (isNative) {
        console.log('[SubscriptionContext] Not subscribed via backend, checking RevenueCat');
        const initialized = await initializeRevenueCat(currentUser.id);
        
        if (initialized) {
          await loginRevenueCat(currentUser.id);
          const hasEntitlement = await checkEntitlement();
          
          setSubscriptionStatus({
            subscribed: hasEntitlement,
            product_id: hasEntitlement ? 'lq_premium_monthly' : null,
            subscription_end: null,
            loading: false
          });
          checkInProgress.current = false;
          return;
        }
      }

      // Not subscribed on any platform
      setSubscriptionStatus({
        subscribed: false,
        product_id: null,
        subscription_end: null,
        loading: false
      });
    } catch (error) {
      console.warn('[SubscriptionContext] Error checking subscription:', error);
      // Don't show error to user, just set as not subscribed
      setSubscriptionStatus(prev => ({
        ...prev,
        loading: false
      }));
    } finally {
      checkInProgress.current = false;
    }
  }, [isNative]);

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

    // Check subscription status every 2 minutes (reduced from 1 minute)
    const interval = setInterval(() => {
      if (user) {
        checkSubscription();
      }
    }, 120000);

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

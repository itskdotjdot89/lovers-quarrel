import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import {
  initializeRevenueCat,
  loginRevenueCat,
  logoutRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkEntitlement,
  isRevenueCatInitialized,
} from '@/lib/revenuecat';

export const useRevenueCat = () => {
  const isNative = Capacitor.isNativePlatform();
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initStarted = useRef(false);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      // Prevent double initialization
      if (initStarted.current) return;
      initStarted.current = true;

      console.log('[useRevenueCat] Starting init, isNative:', isNative);

      if (!isNative) {
        console.log('[useRevenueCat] Not native, skipping RevenueCat init');
        setIsReady(true);
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[useRevenueCat] User:', user?.id || 'not logged in');

        // Initialize RevenueCat
        const initialized = await initializeRevenueCat(user?.id);
        console.log('[useRevenueCat] RevenueCat initialized:', initialized);

        if (!initialized) {
          setError('Failed to initialize RevenueCat');
          setIsReady(true);
          return;
        }

        // Login if user exists
        if (user?.id) {
          await loginRevenueCat(user.id);
        }

        // Check entitlement status
        const hasAccess = await checkEntitlement();
        console.log('[useRevenueCat] Has premium access:', hasAccess);
        setIsPremium(hasAccess);

        // Load offerings
        console.log('[useRevenueCat] Fetching offerings...');
        const currentOfferings = await getOfferings();
        console.log('[useRevenueCat] Offerings loaded:', !!currentOfferings);
        
        if (currentOfferings) {
          console.log('[useRevenueCat] Available packages:', currentOfferings.availablePackages?.length || 0);
          setOfferings(currentOfferings);
        } else {
          console.warn('[useRevenueCat] No offerings returned');
        }

        setIsReady(true);
        console.log('[useRevenueCat] Init complete');
      } catch (err) {
        console.error('[useRevenueCat] Init error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsReady(true);
      }
    };

    init();
  }, [isNative]);

  // Listen for auth changes
  useEffect(() => {
    if (!isNative) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useRevenueCat] Auth state changed:', event);
      
      if (!isRevenueCatInitialized()) {
        console.log('[useRevenueCat] SDK not ready, skipping auth handler');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        await loginRevenueCat(session.user.id);
        const hasAccess = await checkEntitlement();
        setIsPremium(hasAccess);
      } else if (event === 'SIGNED_OUT') {
        await logoutRevenueCat();
        setIsPremium(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isNative]);

  const purchase = useCallback(async (packageId?: string) => {
    if (!isNative || !offerings) {
      throw new Error('Purchases not available');
    }

    setLoading(true);
    setError(null);

    try {
      // Find the package to purchase
      const pkg = packageId
        ? offerings.availablePackages?.find((p: any) => p.identifier === packageId)
        : offerings.availablePackages?.[0];

      if (!pkg) {
        throw new Error('Package not found');
      }

      console.log('[useRevenueCat] Purchasing package:', pkg.identifier);
      const customerInfo = await purchasePackage(pkg);

      if (customerInfo) {
        const hasAccess = customerInfo.entitlements.active['lovers_quarrel_pro'] !== undefined;
        setIsPremium(hasAccess);
        return hasAccess;
      }

      return false; // User cancelled
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isNative, offerings]);

  const restore = useCallback(async () => {
    if (!isNative) {
      throw new Error('Restore not available on web');
    }

    setLoading(true);
    setError(null);

    try {
      const customerInfo = await restorePurchases();
      const hasAccess = customerInfo.entitlements.active['lovers_quarrel_pro'] !== undefined;
      setIsPremium(hasAccess);
      return hasAccess;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Restore failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  const refreshStatus = useCallback(async () => {
    if (!isNative || !isRevenueCatInitialized()) return;

    try {
      const hasAccess = await checkEntitlement();
      setIsPremium(hasAccess);
    } catch (err) {
      console.error('[useRevenueCat] Refresh error:', err);
    }
  }, [isNative]);

  return {
    isNative,
    isReady,
    isPremium,
    offerings,
    loading,
    error,
    purchase,
    restore,
    refreshStatus,
  };
};

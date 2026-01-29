import { useState, useEffect, useCallback } from 'react';
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
} from '@/lib/revenuecat';

export const useRevenueCat = () => {
  const [isNative] = useState(() => Capacitor.isNativePlatform());
  const [isReady, setIsReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize RevenueCat on mount
  useEffect(() => {
    const init = async () => {
      console.log('[useRevenueCat] Starting init, isNative:', isNative);
      
      if (!isNative) {
        console.log('[useRevenueCat] Not native, skipping RevenueCat init');
        setIsReady(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useRevenueCat] User:', user?.id || 'not logged in');
      
      const initialized = await initializeRevenueCat(user?.id);
      console.log('[useRevenueCat] RevenueCat initialized:', initialized);
      
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
      console.log('[useRevenueCat] Available packages:', currentOfferings?.availablePackages?.length || 0);
      setOfferings(currentOfferings);

      setIsReady(true);
      console.log('[useRevenueCat] Init complete, isReady: true');
    };

    init();
  }, [isNative]);

  // Listen for auth changes
  useEffect(() => {
    if (!isNative) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    try {
      // Get the monthly package by default
      const pkg = packageId 
        ? offerings.availablePackages.find((p: any) => p.identifier === packageId)
        : offerings.availablePackages[0];

      if (!pkg) {
        throw new Error('Package not found');
      }

      const customerInfo = await purchasePackage(pkg);
      
      if (customerInfo) {
        const hasAccess = customerInfo.entitlements.active['lovers_quarrel_pro'] !== undefined;
        setIsPremium(hasAccess);
        return hasAccess;
      }
      
      return false; // User cancelled
    } finally {
      setLoading(false);
    }
  }, [isNative, offerings]);

  const restore = useCallback(async () => {
    if (!isNative) {
      throw new Error('Restore not available on web');
    }

    setLoading(true);
    try {
      const customerInfo = await restorePurchases();
      const hasAccess = customerInfo.entitlements.active['lovers_quarrel_pro'] !== undefined;
      setIsPremium(hasAccess);
      return hasAccess;
    } finally {
      setLoading(false);
    }
  }, [isNative]);

  const refreshStatus = useCallback(async () => {
    if (!isNative) return;
    
    const hasAccess = await checkEntitlement();
    setIsPremium(hasAccess);
  }, [isNative]);

  return {
    isNative,
    isReady,
    isPremium,
    offerings,
    loading,
    purchase,
    restore,
    refreshStatus,
  };
};

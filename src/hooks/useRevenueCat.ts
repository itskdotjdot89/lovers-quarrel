import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import {
  initializeRevenueCat,
  getIsInitialized,
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkEntitlement,
  loginRevenueCat,
} from '@/lib/revenuecat';
import { supabase } from '@/integrations/supabase/client';

interface UseRevenueCatReturn {
  isNative: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  isPremium: boolean;
  offerings: PurchasesPackage[];
  currentPrice: string | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export const useRevenueCat = (): UseRevenueCatReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const initialize = useCallback(async () => {
    if (!isNative) {
      setIsLoading(false);
      return;
    }

    try {
      // Get current user for RevenueCat login
      const { data: { user } } = await supabase.auth.getUser();
      
      const initialized = await initializeRevenueCat(user?.id);
      setIsInitialized(initialized);

      if (initialized && user?.id) {
        await loginRevenueCat(user.id);
      }

      if (initialized) {
        // Check entitlement
        const hasAccess = await checkEntitlement();
        setIsPremium(hasAccess);

        // Get offerings
        const offeringsResult = await getOfferings();
        if (offeringsResult?.current?.availablePackages) {
          const packages = offeringsResult.current.availablePackages;
          setOfferings(packages);
          console.log('[useRevenueCat] Available packages:', packages.length);

          // Get price from first package
          if (packages.length > 0) {
            const price = packages[0].product?.priceString;
            setCurrentPrice(price || null);
            console.log('[useRevenueCat] Current price:', price);
          }
        } else {
          console.log('[useRevenueCat] No offerings available');
        }
      }
    } catch (error) {
      console.error('[useRevenueCat] Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('[useRevenueCat] Cannot purchase: not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        const hasAccess = await checkEntitlement();
        setIsPremium(hasAccess);
        return hasAccess;
      }
      return false;
    } catch (error) {
      console.error('[useRevenueCat] Purchase error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const restore = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('[useRevenueCat] Cannot restore: not initialized');
      return false;
    }

    try {
      setIsLoading(true);
      await restorePurchases();
      const hasAccess = await checkEntitlement();
      setIsPremium(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('[useRevenueCat] Restore error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const refreshStatus = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      const hasAccess = await checkEntitlement();
      setIsPremium(hasAccess);
    } catch (error) {
      console.error('[useRevenueCat] Refresh error:', error);
    }
  }, [isInitialized]);

  return {
    isNative,
    isInitialized,
    isLoading,
    isPremium,
    offerings,
    currentPrice,
    purchase,
    restore,
    refreshStatus,
  };
};

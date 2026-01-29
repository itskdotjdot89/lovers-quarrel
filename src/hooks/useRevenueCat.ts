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
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  getSubscriptionExpirationDate,
  isInTrialPeriod,
  PaywallDisplayResult,
} from '@/lib/revenuecat';
import { supabase } from '@/integrations/supabase/client';

interface UseRevenueCatReturn {
  // Platform info
  isNative: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  
  // Subscription status
  isPremium: boolean;
  isTrialing: boolean;
  expirationDate: Date | null;
  
  // Offerings
  offerings: PurchasesPackage[];
  currentPrice: string | null;
  trialDuration: string | null;
  
  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  
  // Paywall & Customer Center
  showPaywall: () => Promise<PaywallDisplayResult>;
  showPaywallIfNeeded: () => Promise<PaywallDisplayResult>;
  showCustomerCenter: () => Promise<boolean>;
}

export const useRevenueCat = (): UseRevenueCatReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [trialDuration, setTrialDuration] = useState<string | null>(null);

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
        // Check entitlement status
        const hasAccess = await checkEntitlement();
        setIsPremium(hasAccess);

        // Check trial status
        const inTrial = await isInTrialPeriod();
        setIsTrialing(inTrial);

        // Get expiration date
        const expDate = await getSubscriptionExpirationDate();
        setExpirationDate(expDate);

        // Get offerings
        const offeringsResult = await getOfferings();
        if (offeringsResult?.current?.availablePackages) {
          const packages = offeringsResult.current.availablePackages;
          setOfferings(packages);
          console.log('[useRevenueCat] Available packages:', packages.length);

          // Get price and trial info from first package (monthly)
          if (packages.length > 0) {
            const pkg = packages[0];
            const price = pkg.product?.priceString;
            setCurrentPrice(price || null);
            console.log('[useRevenueCat] Current price:', price);

            // Extract trial duration if available
            const introPrice = pkg.product?.introPrice;
            if (introPrice) {
              const periodUnit = introPrice.periodUnit;
              const periodNumber = introPrice.periodNumberOfUnits;
              if (periodUnit && periodNumber) {
                setTrialDuration(`${periodNumber} ${periodUnit.toLowerCase()}${periodNumber > 1 ? 's' : ''}`);
              }
            }
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
        
        const inTrial = await isInTrialPeriod();
        setIsTrialing(inTrial);
        
        const expDate = await getSubscriptionExpirationDate();
        setExpirationDate(expDate);
        
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
      
      const inTrial = await isInTrialPeriod();
      setIsTrialing(inTrial);
      
      const expDate = await getSubscriptionExpirationDate();
      setExpirationDate(expDate);
      
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
      setIsLoading(true);
      const hasAccess = await checkEntitlement();
      setIsPremium(hasAccess);
      
      const inTrial = await isInTrialPeriod();
      setIsTrialing(inTrial);
      
      const expDate = await getSubscriptionExpirationDate();
      setExpirationDate(expDate);
    } catch (error) {
      console.error('[useRevenueCat] Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const showPaywall = useCallback(async (): Promise<PaywallDisplayResult> => {
    if (!isInitialized) {
      return { success: false, purchased: false, restored: false, cancelled: false, error: 'Not initialized' };
    }
    
    const result = await presentPaywall();
    
    // Refresh status after paywall interaction
    if (result.purchased || result.restored) {
      await refreshStatus();
    }
    
    return result;
  }, [isInitialized, refreshStatus]);

  const showPaywallIfNeeded = useCallback(async (): Promise<PaywallDisplayResult> => {
    if (!isInitialized) {
      return { success: false, purchased: false, restored: false, cancelled: false, error: 'Not initialized' };
    }
    
    const result = await presentPaywallIfNeeded();
    
    // Refresh status after paywall interaction
    if (result.purchased || result.restored) {
      await refreshStatus();
    }
    
    return result;
  }, [isInitialized, refreshStatus]);

  const showCustomerCenter = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      console.warn('[useRevenueCat] Cannot show Customer Center: not initialized');
      return false;
    }
    
    const success = await presentCustomerCenter();
    
    // Refresh status after customer center interaction (user may have changed plan)
    if (success) {
      await refreshStatus();
    }
    
    return success;
  }, [isInitialized, refreshStatus]);

  return {
    isNative,
    isInitialized,
    isLoading,
    isPremium,
    isTrialing,
    expirationDate,
    offerings,
    currentPrice,
    trialDuration,
    purchase,
    restore,
    refreshStatus,
    showPaywall,
    showPaywallIfNeeded,
    showCustomerCenter,
  };
};

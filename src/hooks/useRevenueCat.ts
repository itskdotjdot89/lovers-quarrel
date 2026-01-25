import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { REVENUECAT_CONFIG } from '@/lib/revenuecat';

// Paywall result types
export enum PAYWALL_RESULT {
  NOT_PRESENTED = 'NOT_PRESENTED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED',
  PURCHASED = 'PURCHASED',
  RESTORED = 'RESTORED'
}

// Use 'any' for SDK types since they're dynamically imported
type PurchasesType = any;
type RevenueCatUIType = any;
type CustomerInfoType = any;
type OfferingsType = any;
type PackageType = any;

export const useRevenueCat = () => {
  const [isNative, setIsNative] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoType | null>(null);
  const [offerings, setOfferings] = useState<OfferingsType | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const purchasesRef = useRef<PurchasesType | null>(null);
  const purchasesUIRef = useRef<RevenueCatUIType | null>(null);
  const logLevelRef = useRef<any>(null);

  // Check if we have the Pro entitlement
  const checkProAccess = useCallback((info: CustomerInfoType | null) => {
    if (!info) {
      setIsPro(false);
      return false;
    }
    const hasEntitlement = !!info.entitlements?.active?.[REVENUECAT_CONFIG.entitlementId];
    setIsPro(hasEntitlement);
    return hasEntitlement;
  }, []);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const init = async () => {
      // Check if running on native platform
      const platform = Capacitor.getPlatform();
      const isNativePlatform = platform === 'ios' || platform === 'android';
      setIsNative(isNativePlatform);

      if (!isNativePlatform) {
        // Not on native, mark as ready but skip SDK init
        setIsReady(true);
        return;
      }

      try {
        // Dynamically import RevenueCat SDK (only works on native)
        const purchasesModule = await import('@revenuecat/purchases-capacitor');
        const uiModule = await import('@revenuecat/purchases-capacitor-ui');
        
        const Purchases = purchasesModule.Purchases;
        const RevenueCatUI = uiModule.RevenueCatUI;
        
        purchasesRef.current = Purchases;
        purchasesUIRef.current = RevenueCatUI;
        
        // Store LOG_LEVEL if available
        if (purchasesModule.LOG_LEVEL) {
          logLevelRef.current = purchasesModule.LOG_LEVEL;
        }

        // Configure the SDK
        await Purchases.configure({
          apiKey: REVENUECAT_CONFIG.apiKey,
        });

        // Enable debug logs in development
        if (import.meta.env.DEV && logLevelRef.current) {
          await Purchases.setLogLevel({ level: logLevelRef.current.DEBUG });
        }

        // Set up customer info listener
        await Purchases.addCustomerInfoUpdateListener((info: CustomerInfoType) => {
          console.log('[RevenueCat] Customer info updated:', info);
          setCustomerInfo(info);
          checkProAccess(info);
        });

        // Get initial customer info
        const customerInfoResult = await Purchases.getCustomerInfo();
        setCustomerInfo(customerInfoResult.customerInfo);
        checkProAccess(customerInfoResult.customerInfo);

        // Fetch offerings
        const offeringsResult = await Purchases.getOfferings();
        setOfferings(offeringsResult);

        setIsReady(true);
        console.log('[RevenueCat] SDK initialized successfully');
      } catch (err) {
        console.error('[RevenueCat] Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize RevenueCat');
        setIsReady(true); // Still mark as ready so app doesn't hang
      }
    };

    init();
  }, [checkProAccess]);

  // Login user with Supabase ID
  const login = useCallback(async (userId: string): Promise<CustomerInfoType | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot login - not on native platform');
      return null;
    }

    try {
      setIsLoading(true);
      const result = await purchasesRef.current.logIn({ appUserID: userId });
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      console.log('[RevenueCat] User logged in:', userId);
      return result.customerInfo;
    } catch (err) {
      console.error('[RevenueCat] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkProAccess]);

  // Logout user
  const logout = useCallback(async (): Promise<void> => {
    if (!purchasesRef.current || !isNative) return;

    try {
      setIsLoading(true);
      const result = await purchasesRef.current.logOut();
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      console.log('[RevenueCat] User logged out');
    } catch (err) {
      console.error('[RevenueCat] Logout failed:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkProAccess]);

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PackageType): Promise<{ customerInfo: CustomerInfoType; productIdentifier: string } | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot purchase - not on native platform');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await purchasesRef.current.purchasePackage({ aPackage: pkg });
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      
      console.log('[RevenueCat] Purchase successful');
      return result;
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // User cancelled - not an error
      if (error.code === 'PURCHASE_CANCELLED') {
        console.log('[RevenueCat] Purchase cancelled by user');
        return null;
      }
      console.error('[RevenueCat] Purchase failed:', err);
      setError(error.message || 'Purchase failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkProAccess]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<CustomerInfoType | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot restore - not on native platform');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await purchasesRef.current.restorePurchases();
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      
      console.log('[RevenueCat] Purchases restored');
      return result.customerInfo;
    } catch (err) {
      console.error('[RevenueCat] Restore failed:', err);
      setError(err instanceof Error ? err.message : 'Restore failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkProAccess]);

  // Get customer info
  const getCustomerInfo = useCallback(async (): Promise<CustomerInfoType | null> => {
    if (!purchasesRef.current || !isNative) return null;

    try {
      const result = await purchasesRef.current.getCustomerInfo();
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      return result.customerInfo;
    } catch (err) {
      console.error('[RevenueCat] Failed to get customer info:', err);
      return null;
    }
  }, [isNative, checkProAccess]);

  // Get offerings
  const getOfferings = useCallback(async (): Promise<OfferingsType | null> => {
    if (!purchasesRef.current || !isNative) return null;

    try {
      const result = await purchasesRef.current.getOfferings();
      setOfferings(result);
      return result;
    } catch (err) {
      console.error('[RevenueCat] Failed to get offerings:', err);
      return null;
    }
  }, [isNative]);

  // Present RevenueCat Paywall
  const presentPaywall = useCallback(async (): Promise<PAYWALL_RESULT> => {
    if (!purchasesUIRef.current || !isNative) {
      console.log('[RevenueCat] Cannot present paywall - not on native platform');
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await purchasesUIRef.current.presentPaywall();
      
      // Refresh customer info after paywall
      await getCustomerInfo();
      
      console.log('[RevenueCat] Paywall result:', result);
      
      // Map the result to our enum
      if (result === 'PURCHASED' || result?.paywallResult === 'PURCHASED') {
        return PAYWALL_RESULT.PURCHASED;
      } else if (result === 'RESTORED' || result?.paywallResult === 'RESTORED') {
        return PAYWALL_RESULT.RESTORED;
      } else if (result === 'CANCELLED' || result?.paywallResult === 'CANCELLED') {
        return PAYWALL_RESULT.CANCELLED;
      } else if (result === 'ERROR' || result?.paywallResult === 'ERROR') {
        return PAYWALL_RESULT.ERROR;
      }
      return PAYWALL_RESULT.CANCELLED;
    } catch (err) {
      console.error('[RevenueCat] Paywall error:', err);
      setError(err instanceof Error ? err.message : 'Paywall error');
      return PAYWALL_RESULT.ERROR;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, getCustomerInfo]);

  // Present RevenueCat Paywall for a specific offering
  const presentPaywallIfNeeded = useCallback(async (requiredEntitlement?: string): Promise<PAYWALL_RESULT> => {
    if (!purchasesUIRef.current || !isNative) {
      return PAYWALL_RESULT.NOT_PRESENTED;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const entitlement = requiredEntitlement || REVENUECAT_CONFIG.entitlementId;
      const result = await purchasesUIRef.current.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: entitlement
      });
      
      // Refresh customer info after paywall
      await getCustomerInfo();
      
      // Map the result to our enum
      if (result === 'PURCHASED' || result?.paywallResult === 'PURCHASED') {
        return PAYWALL_RESULT.PURCHASED;
      } else if (result === 'RESTORED' || result?.paywallResult === 'RESTORED') {
        return PAYWALL_RESULT.RESTORED;
      } else if (result === 'CANCELLED' || result?.paywallResult === 'CANCELLED') {
        return PAYWALL_RESULT.CANCELLED;
      }
      return PAYWALL_RESULT.NOT_PRESENTED;
    } catch (err) {
      console.error('[RevenueCat] Paywall error:', err);
      setError(err instanceof Error ? err.message : 'Paywall error');
      return PAYWALL_RESULT.ERROR;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, getCustomerInfo]);

  // Present Customer Center for subscription management
  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (!purchasesUIRef.current || !isNative) {
      console.log('[RevenueCat] Cannot present customer center - not on native platform');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await purchasesUIRef.current.presentCustomerCenter();
      
      // Refresh customer info after customer center
      await getCustomerInfo();
      
      console.log('[RevenueCat] Customer center closed');
    } catch (err) {
      console.error('[RevenueCat] Customer center error:', err);
      setError(err instanceof Error ? err.message : 'Customer center error');
    } finally {
      setIsLoading(false);
    }
  }, [isNative, getCustomerInfo]);

  return {
    // State
    isNative,
    isReady,
    isLoading,
    customerInfo,
    offerings,
    isPro,
    error,
    
    // Methods
    login,
    logout,
    purchasePackage,
    restorePurchases,
    getCustomerInfo,
    getOfferings,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
  };
};

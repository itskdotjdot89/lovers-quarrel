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

// SDK types (dynamically imported)
type PurchasesSDK = any;
type RevenueCatUISDK = any;
type CustomerInfo = any;
type Offerings = any;
type Package = any;

export const useRevenueCat = () => {
  const [isNative, setIsNative] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const purchasesRef = useRef<PurchasesSDK | null>(null);
  const purchasesUIRef = useRef<RevenueCatUISDK | null>(null);
  const logLevelRef = useRef<any>(null);
  const initializingRef = useRef(false);

  // Check if user has Pro entitlement
  const checkProAccess = useCallback((info: CustomerInfo | null): boolean => {
    if (!info) {
      setIsPro(false);
      return false;
    }
    const hasEntitlement = !!info.entitlements?.active?.[REVENUECAT_CONFIG.entitlementId];
    console.log('[RevenueCat] Pro access check:', { hasEntitlement, entitlementId: REVENUECAT_CONFIG.entitlementId });
    setIsPro(hasEntitlement);
    return hasEntitlement;
  }, []);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const init = async () => {
      // Prevent double initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      const platform = Capacitor.getPlatform();
      const isNativePlatform = platform === 'ios' || platform === 'android';
      setIsNative(isNativePlatform);
      
      console.log('[RevenueCat] Initializing on platform:', platform);

      if (!isNativePlatform) {
        console.log('[RevenueCat] Not on native platform, skipping SDK init');
        setIsReady(true);
        return;
      }

      try {
        // Dynamically import RevenueCat SDK (only works on native)
        console.log('[RevenueCat] Importing SDK modules...');
        const purchasesModule = await import('@revenuecat/purchases-capacitor');
        const uiModule = await import('@revenuecat/purchases-capacitor-ui');
        
        const Purchases = purchasesModule.Purchases;
        const RevenueCatUI = uiModule.RevenueCatUI;
        
        purchasesRef.current = Purchases;
        purchasesUIRef.current = RevenueCatUI;
        
        if (purchasesModule.LOG_LEVEL) {
          logLevelRef.current = purchasesModule.LOG_LEVEL;
        }

        // Configure the SDK
        console.log('[RevenueCat] Configuring SDK with API key...');
        await Purchases.configure({
          apiKey: REVENUECAT_CONFIG.apiKey,
        });

        // Enable debug logs in development
        if (import.meta.env.DEV && logLevelRef.current) {
          await Purchases.setLogLevel({ level: logLevelRef.current.DEBUG });
        }

        // Set up customer info listener
        await Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
          console.log('[RevenueCat] Customer info updated');
          setCustomerInfo(info);
          checkProAccess(info);
        });

        // Get initial customer info
        console.log('[RevenueCat] Fetching initial customer info...');
        const customerInfoResult = await Purchases.getCustomerInfo();
        setCustomerInfo(customerInfoResult.customerInfo);
        checkProAccess(customerInfoResult.customerInfo);

        // Fetch offerings
        console.log('[RevenueCat] Fetching offerings...');
        const offeringsResult = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings result:', JSON.stringify(offeringsResult, null, 2));
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

  // Login user with their ID
  const login = useCallback(async (userId: string): Promise<CustomerInfo | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot login - SDK not available or not on native');
      return null;
    }

    try {
      setIsLoading(true);
      console.log('[RevenueCat] Logging in user:', userId);
      const result = await purchasesRef.current.logIn({ appUserID: userId });
      setCustomerInfo(result.customerInfo);
      checkProAccess(result.customerInfo);
      console.log('[RevenueCat] User logged in successfully');
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
  const purchasePackage = useCallback(async (pkg: Package): Promise<{ customerInfo: CustomerInfo; productIdentifier: string } | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot purchase - SDK not available');
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
    } catch (err: any) {
      if (err.code === 'PURCHASE_CANCELLED') {
        console.log('[RevenueCat] Purchase cancelled by user');
        return null;
      }
      console.error('[RevenueCat] Purchase failed:', err);
      setError(err.message || 'Purchase failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, checkProAccess]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    if (!purchasesRef.current || !isNative) {
      console.log('[RevenueCat] Cannot restore - SDK not available');
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
  const getCustomerInfo = useCallback(async (): Promise<CustomerInfo | null> => {
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
  const getOfferings = useCallback(async (): Promise<Offerings | null> => {
    if (!purchasesRef.current || !isNative) return null;

    try {
      const result = await purchasesRef.current.getOfferings();
      console.log('[RevenueCat] Offerings fetched:', JSON.stringify(result, null, 2));
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
      
      console.log('[RevenueCat] Presenting paywall...');
      const result = await purchasesUIRef.current.presentPaywall();
      console.log('[RevenueCat] Paywall result:', result);
      
      // Refresh customer info after paywall
      await getCustomerInfo();
      
      // Map the result to our enum
      const paywallResult = result?.paywallResult || result;
      if (paywallResult === 'PURCHASED') {
        return PAYWALL_RESULT.PURCHASED;
      } else if (paywallResult === 'RESTORED') {
        return PAYWALL_RESULT.RESTORED;
      } else if (paywallResult === 'CANCELLED') {
        return PAYWALL_RESULT.CANCELLED;
      } else if (paywallResult === 'ERROR') {
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

  // Present RevenueCat Paywall if needed (checks entitlement first)
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
      
      await getCustomerInfo();
      
      const paywallResult = result?.paywallResult || result;
      if (paywallResult === 'PURCHASED') {
        return PAYWALL_RESULT.PURCHASED;
      } else if (paywallResult === 'RESTORED') {
        return PAYWALL_RESULT.RESTORED;
      } else if (paywallResult === 'CANCELLED') {
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
      console.log('[RevenueCat] Cannot present customer center - not on native');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await purchasesUIRef.current.presentCustomerCenter();
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

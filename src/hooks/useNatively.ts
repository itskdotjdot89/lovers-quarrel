import { useState, useEffect, useCallback } from 'react';

interface NativelyPurchaseResponse {
  status: 'SUCCESS' | 'CANCELLED' | 'ERROR';
  error?: string;
  customerId?: string;
}

interface NativelyPurchases {
  login: (userId: string, email: string, callback: (resp: NativelyPurchaseResponse) => void) => void;
  purchasePackage: (packageId: string, callback: (resp: NativelyPurchaseResponse) => void) => void;
  restore: (callback: (resp: NativelyPurchaseResponse) => void) => void;
  getCustomerInfo: (callback: (resp: any) => void) => void;
}

declare global {
  interface Window {
    natively?: {
      isNativeApp?: boolean;
      purchases?: NativelyPurchases;
    };
    NativelyPurchases?: new () => NativelyPurchases;
  }
}

export const useNatively = () => {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [purchases, setPurchases] = useState<NativelyPurchases | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if running inside Natively app
    const checkNatively = () => {
      const isNative = !!(
        window.natively?.isNativeApp || 
        window.NativelyPurchases ||
        navigator.userAgent.includes('Natively')
      );
      setIsNativeApp(isNative);

      if (isNative && window.NativelyPurchases) {
        setPurchases(new window.NativelyPurchases());
      }
    };

    checkNatively();
    
    // Also check after a short delay in case SDK loads async
    const timeout = setTimeout(checkNatively, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const loginToRevenueCat = useCallback((userId: string, email: string): Promise<NativelyPurchaseResponse> => {
    return new Promise((resolve) => {
      if (!purchases) {
        resolve({ status: 'ERROR', error: 'Purchases not available' });
        return;
      }
      purchases.login(userId, email, (resp) => {
        resolve(resp);
      });
    });
  }, [purchases]);

  const purchasePackage = useCallback((packageId: string): Promise<NativelyPurchaseResponse> => {
    return new Promise((resolve) => {
      if (!purchases) {
        resolve({ status: 'ERROR', error: 'Purchases not available' });
        return;
      }
      setIsLoading(true);
      purchases.purchasePackage(packageId, (resp) => {
        setIsLoading(false);
        resolve(resp);
      });
    });
  }, [purchases]);

  const restorePurchases = useCallback((): Promise<NativelyPurchaseResponse> => {
    return new Promise((resolve) => {
      if (!purchases) {
        resolve({ status: 'ERROR', error: 'Purchases not available' });
        return;
      }
      setIsLoading(true);
      purchases.restore((resp) => {
        setIsLoading(false);
        resolve(resp);
      });
    });
  }, [purchases]);

  return {
    isNativeApp,
    isLoading,
    loginToRevenueCat,
    purchasePackage,
    restorePurchases,
  };
};

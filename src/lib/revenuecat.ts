import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL, CustomerInfo, PurchasesOfferings } from '@revenuecat/purchases-capacitor';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';
const ENTITLEMENT_ID = 'lovers_quarrel_pro';

let isInitialized = false;

export const initializeRevenueCat = async (userId?: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Not a native platform, skipping initialization');
    return false;
  }

  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return true;
  }

  if (!REVENUECAT_API_KEY) {
    console.error('[RevenueCat] API key not found');
    return false;
  }

  console.log('[RevenueCat] API Key present:', !!REVENUECAT_API_KEY);

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    return false;
  }
};

export const getIsInitialized = (): boolean => isInitialized;

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] getCustomerInfo: SDK not initialized yet');
    return null;
  }
  
  try {
    const result = await Purchases.getCustomerInfo();
    return result.customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    return null;
  }
};

export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] getOfferings: SDK not initialized yet');
    return null;
  }
  
  try {
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Offerings response:', JSON.stringify(offerings, null, 2));
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
};

export const checkEntitlement = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] checkEntitlement: SDK not initialized yet');
    return false;
  }
  
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    
    const hasEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('[RevenueCat] Has entitlement:', hasEntitlement);
    return hasEntitlement;
  } catch (error) {
    console.error('[RevenueCat] Error checking entitlement:', error);
    return false;
  }
};

export const purchasePackage = async (packageToPurchase: any): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] purchasePackage: SDK not initialized yet');
    return null;
  }
  
  try {
    const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
    return result.customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      return null;
    }
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] restorePurchases: SDK not initialized yet');
    return null;
  }
  
  try {
    const result = await Purchases.restorePurchases();
    return result.customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
};

export const loginRevenueCat = async (userId: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] loginRevenueCat: SDK not initialized yet');
    return;
  }
  
  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[RevenueCat] Logged in with user ID:', userId);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
};

export const logoutRevenueCat = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] logoutRevenueCat: SDK not initialized yet');
    return;
  }
  
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] Logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
};

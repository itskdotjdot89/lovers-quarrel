import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

// Track initialization state
let isInitialized = false;

export const initializeRevenueCat = async (userId?: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Skipping initialization - not on native platform');
    return false;
  }

  console.log('[RevenueCat] API Key present:', !!REVENUECAT_API_KEY);
  console.log('[RevenueCat] API Key prefix:', REVENUECAT_API_KEY?.substring(0, 10) + '...');

  if (!REVENUECAT_API_KEY) {
    console.error('[RevenueCat] API key not configured - check VITE_REVENUECAT_API_KEY in .env');
    return false;
  }

  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return true;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully with userId:', userId || 'anonymous');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    return false;
  }
};

export const loginRevenueCat = async (userId: string) => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[RevenueCat] User logged in:', userId);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
};

export const logoutRevenueCat = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
};

export const getOfferings = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] getOfferings: Not on native platform');
    return null;
  }

  if (!isInitialized) {
    console.warn('[RevenueCat] getOfferings: SDK not initialized yet');
    return null;
  }
  
  try {
    console.log('[RevenueCat] Fetching offerings...');
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Offerings response:', JSON.stringify(offerings, null, 2));
    console.log('[RevenueCat] Current offering:', offerings.current);
    console.log('[RevenueCat] Available packages:', offerings.current?.availablePackages?.length || 0);
    
    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg: any, index: number) => {
        console.log(`[RevenueCat] Package ${index}:`, pkg.identifier, pkg.product?.priceString);
      });
    }
    
    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
};

export const purchasePackage = async (packageToPurchase: any) => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Purchases only available on native platforms');
  }
  
  try {
    const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
    return result.customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      return null;
    }
    throw error;
  }
};

export const restorePurchases = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Restore only available on native platforms');
  }
  
  try {
    const result = await Purchases.restorePurchases();
    return result.customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
};

export const getCustomerInfo = async () => {
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

export const checkEntitlement = async (entitlementId: string = 'lovers_quarrel_pro') => {
  const customerInfo = await getCustomerInfo();
  if (!customerInfo) return false;
  
  return customerInfo.entitlements.active[entitlementId] !== undefined;
};

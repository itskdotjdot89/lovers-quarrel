import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

export const initializeRevenueCat = async (userId?: string) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Skipping initialization - not on native platform');
    return;
  }

  if (!REVENUECAT_API_KEY) {
    console.error('[RevenueCat] API key not configured');
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
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
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    const offerings = await Purchases.getOfferings();
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

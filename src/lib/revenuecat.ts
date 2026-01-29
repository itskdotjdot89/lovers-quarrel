import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY;

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Initialize RevenueCat SDK - must be called before any other RevenueCat methods
 * Uses a singleton pattern to prevent multiple initializations
 */
export const initializeRevenueCat = async (userId?: string): Promise<boolean> => {
  // Skip if not on native platform
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Skipping - not on native platform');
    return false;
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Already initialized
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return true;
  }

  // Check for API key
  if (!REVENUECAT_API_KEY) {
    console.error('[RevenueCat] API key not configured - check VITE_REVENUECAT_API_KEY');
    return false;
  }

  console.log('[RevenueCat] API Key present:', !!REVENUECAT_API_KEY);
  console.log('[RevenueCat] Initializing with userId:', userId || 'anonymous');

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      // Set debug logging
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      // Configure the SDK
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId || undefined,
      });

      isInitialized = true;
      console.log('[RevenueCat] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[RevenueCat] Initialization error:', error);
      initializationPromise = null; // Reset to allow retry
      return false;
    }
  })();

  return initializationPromise;
};

/**
 * Check if RevenueCat is initialized
 */
export const isRevenueCatInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Wait for RevenueCat to be initialized
 */
export const waitForInitialization = async (): Promise<boolean> => {
  if (isInitialized) return true;
  if (initializationPromise) return initializationPromise;
  return false;
};

/**
 * Login user to RevenueCat
 */
export const loginRevenueCat = async (userId: string): Promise<void> => {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[RevenueCat] User logged in:', userId);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
};

/**
 * Logout user from RevenueCat
 */
export const logoutRevenueCat = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
};

/**
 * Get available offerings/products
 */
export const getOfferings = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] getOfferings: Not on native platform');
    return null;
  }

  if (!isInitialized) {
    console.warn('[RevenueCat] getOfferings: SDK not initialized - waiting...');
    const ready = await waitForInitialization();
    if (!ready) {
      console.error('[RevenueCat] getOfferings: SDK failed to initialize');
      return null;
    }
  }

  try {
    console.log('[RevenueCat] Fetching offerings...');
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Offerings response:', JSON.stringify(offerings, null, 2));
    console.log('[RevenueCat] Current offering:', offerings.current?.identifier);
    console.log('[RevenueCat] Available packages:', offerings.current?.availablePackages?.length || 0);

    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg: any, index: number) => {
        console.log(`[RevenueCat] Package ${index}: ${pkg.identifier} - ${pkg.product?.priceString}`);
      });
    }

    return offerings.current;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    return null;
  }
};

/**
 * Purchase a package
 */
export const purchasePackage = async (packageToPurchase: any) => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Purchases only available on native platforms');
  }

  if (!isInitialized) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    console.log('[RevenueCat] Purchasing package:', packageToPurchase.identifier);
    const result = await Purchases.purchasePackage({ aPackage: packageToPurchase });
    console.log('[RevenueCat] Purchase successful');
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

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Restore only available on native platforms');
  }

  if (!isInitialized) {
    throw new Error('RevenueCat not initialized');
  }

  try {
    console.log('[RevenueCat] Restoring purchases...');
    const result = await Purchases.restorePurchases();
    console.log('[RevenueCat] Restore complete');
    return result.customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
};

/**
 * Get current customer info
 */
export const getCustomerInfo = async () => {
  if (!Capacitor.isNativePlatform()) return null;

  if (!isInitialized) {
    console.warn('[RevenueCat] getCustomerInfo: SDK not initialized');
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

/**
 * Check if user has a specific entitlement
 */
export const checkEntitlement = async (entitlementId: string = 'lovers_quarrel_pro'): Promise<boolean> => {
  const customerInfo = await getCustomerInfo();
  if (!customerInfo) return false;

  const hasAccess = customerInfo.entitlements.active[entitlementId] !== undefined;
  console.log(`[RevenueCat] Entitlement "${entitlementId}":`, hasAccess);
  return hasAccess;
};

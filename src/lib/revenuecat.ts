import { Capacitor } from '@capacitor/core';
import { 
  Purchases, 
  LOG_LEVEL, 
  CustomerInfo, 
  PurchasesOfferings,
  PurchasesPackage 
} from '@revenuecat/purchases-capacitor';
import { 
  RevenueCatUI,
  PaywallResult,
  PAYWALL_RESULT,
  PresentPaywallIfNeededOptions,
} from '@revenuecat/purchases-capacitor-ui';

// RevenueCat Configuration
const REVENUECAT_API_KEY = 'appl_DnGNlNmlksfybRbsarhvRSSXBOJ';
const ENTITLEMENT_ID = 'Lovers Quarrel Pro';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'lq_premium_monthly',
} as const;

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called early in app lifecycle, typically in App.tsx or main.tsx
 */
export const initializeRevenueCat = async (userId?: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Not a native platform, skipping initialization');
    return false;
  }

  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return true;
  }

  try {
    // Enable debug logging in development
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || null,
    });

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
    console.log('[RevenueCat] Entitlement ID:', ENTITLEMENT_ID);
    return true;
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    return false;
  }
};

/**
 * Check if RevenueCat SDK is initialized
 */
export const getIsInitialized = (): boolean => isInitialized;

/**
 * Get current customer info including entitlements and subscriptions
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] getCustomerInfo: SDK not initialized yet');
    return null;
  }
  
  try {
    const result = await Purchases.getCustomerInfo();
    console.log('[RevenueCat] Customer Info:', JSON.stringify(result.customerInfo, null, 2));
    return result.customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    return null;
  }
};

/**
 * Get available offerings (products) from RevenueCat
 */
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

/**
 * Check if user has the premium entitlement
 */
export const checkEntitlement = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] checkEntitlement: SDK not initialized yet');
    return false;
  }
  
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    
    // Check for entitlement by ID
    const hasEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('[RevenueCat] Has entitlement "' + ENTITLEMENT_ID + '":', hasEntitlement);
    console.log('[RevenueCat] Active entitlements:', Object.keys(customerInfo.entitlements.active));
    return hasEntitlement;
  } catch (error) {
    console.error('[RevenueCat] Error checking entitlement:', error);
    return false;
  }
};

/**
 * Purchase a specific package
 */
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] purchasePackage: SDK not initialized yet');
    return null;
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
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] restorePurchases: SDK not initialized yet');
    return null;
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
 * Login user to RevenueCat (associates purchases with user ID)
 */
export const loginRevenueCat = async (userId: string, displayName?: string, email?: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;
  
  if (!isInitialized) {
    console.warn('[RevenueCat] loginRevenueCat: SDK not initialized yet');
    return;
  }
  
  try {
    await Purchases.logIn({ appUserID: userId });
    console.log('[RevenueCat] Logged in with user ID:', userId);

    // Sync subscriber attributes
    if (displayName) {
      await Purchases.setDisplayName({ displayName });
      console.log('[RevenueCat] Set display name:', displayName);
    }
    if (email) {
      await Purchases.setEmail({ email });
      console.log('[RevenueCat] Set email:', email);
    }
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
};

/**
 * Logout user from RevenueCat
 */
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

// ============================================
// PAYWALL FUNCTIONALITY (RevenueCatUI)
// ============================================

export interface PaywallDisplayResult {
  success: boolean;
  purchased: boolean;
  restored: boolean;
  cancelled: boolean;
  error?: string;
}

/**
 * Present the RevenueCat Paywall
 * Shows the configured paywall from RevenueCat dashboard
 */
export const presentPaywall = async (): Promise<PaywallDisplayResult> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Paywall not available on web');
    return { success: false, purchased: false, restored: false, cancelled: false, error: 'Not on native platform' };
  }
  
  if (!isInitialized) {
    console.warn('[RevenueCat] presentPaywall: SDK not initialized yet');
    return { success: false, purchased: false, restored: false, cancelled: false, error: 'SDK not initialized' };
  }
  
  try {
    console.log('[RevenueCat] Presenting paywall...');
    
    const result: PaywallResult = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
    });
    
    console.log('[RevenueCat] Paywall result:', result.result);
    
    return {
      success: true,
      purchased: result.result === PAYWALL_RESULT.PURCHASED,
      restored: result.result === PAYWALL_RESULT.RESTORED,
      cancelled: result.result === PAYWALL_RESULT.CANCELLED,
    };
  } catch (error: any) {
    console.error('[RevenueCat] Paywall error:', error);
    return { 
      success: false, 
      purchased: false, 
      restored: false, 
      cancelled: false,
      error: error.message || 'Unknown error' 
    };
  }
};

/**
 * Present paywall if user doesn't have required entitlement
 * Uses RevenueCat's built-in entitlement check
 */
export const presentPaywallIfNeeded = async (): Promise<PaywallDisplayResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, purchased: false, restored: false, cancelled: false, error: 'Not on native platform' };
  }
  
  if (!isInitialized) {
    return { success: false, purchased: false, restored: false, cancelled: false, error: 'SDK not initialized' };
  }
  
  try {
    console.log('[RevenueCat] Presenting paywall if needed for entitlement:', ENTITLEMENT_ID);
    
    const options: PresentPaywallIfNeededOptions = {
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
      displayCloseButton: true,
    };
    
    const result: PaywallResult = await RevenueCatUI.presentPaywallIfNeeded(options);
    
    console.log('[RevenueCat] Paywall if needed result:', result.result);
    
    // NOT_PRESENTED means user already has the entitlement
    const notPresented = result.result === PAYWALL_RESULT.NOT_PRESENTED;
    
    return {
      success: true,
      purchased: result.result === PAYWALL_RESULT.PURCHASED,
      restored: result.result === PAYWALL_RESULT.RESTORED,
      cancelled: result.result === PAYWALL_RESULT.CANCELLED || notPresented,
    };
  } catch (error: any) {
    console.error('[RevenueCat] presentPaywallIfNeeded error:', error);
    return { 
      success: false, 
      purchased: false, 
      restored: false, 
      cancelled: false,
      error: error.message 
    };
  }
};

// ============================================
// CUSTOMER CENTER FUNCTIONALITY
// ============================================

/**
 * Present the RevenueCat Customer Center
 * Allows users to manage their subscription (cancel, change plan, etc.)
 */
export const presentCustomerCenter = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[RevenueCat] Customer Center not available on web');
    return false;
  }
  
  if (!isInitialized) {
    console.warn('[RevenueCat] presentCustomerCenter: SDK not initialized yet');
    return false;
  }
  
  try {
    console.log('[RevenueCat] Presenting Customer Center...');
    await RevenueCatUI.presentCustomerCenter();
    console.log('[RevenueCat] Customer Center dismissed');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Customer Center error:', error);
    return false;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the entitlement ID being used
 */
export const getEntitlementId = (): string => ENTITLEMENT_ID;

/**
 * Get subscription management URL for current user
 * Useful as fallback if Customer Center is not available
 */
export const getManagementURL = async (): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo?.managementURL || null;
  } catch (error) {
    console.error('[RevenueCat] Error getting management URL:', error);
    return null;
  }
};

/**
 * Check if user is in trial period
 */
export const isInTrialPeriod = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return false;
    
    // Check if user is in trial (periodType is 'trial' or similar)
    // This depends on RevenueCat SDK version
    return entitlement.periodType === 'TRIAL' || entitlement.periodType === 'trial';
  } catch (error) {
    console.error('[RevenueCat] Error checking trial status:', error);
    return false;
  }
};

/**
 * Get expiration date for current subscription
 */
export const getSubscriptionExpirationDate = async (): Promise<Date | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement || !entitlement.expirationDate) return null;
    
    return new Date(entitlement.expirationDate);
  } catch (error) {
    console.error('[RevenueCat] Error getting expiration date:', error);
    return null;
  }
};

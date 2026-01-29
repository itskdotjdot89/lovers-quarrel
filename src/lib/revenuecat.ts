// RevenueCat Configuration
// This file contains all RevenueCat-related configuration constants

export const REVENUECAT_CONFIG = {
  // API Key - Retrieved from environment variable or falls back to test key
  // Production key should start with 'appl_' for iOS
  // Set VITE_REVENUECAT_API_KEY in your environment for production
  apiKey: import.meta.env.VITE_REVENUECAT_API_KEY || 'test_JClmEDorZgpEYhnbveeKfuFxvNx',
  
  // Entitlement identifier - must match RevenueCat Dashboard
  // Users with this entitlement have premium access
  entitlementId: 'lovers_quarrel_pro',
  
  // Product identifiers - must match App Store Connect AND RevenueCat Dashboard
  products: {
    monthly: 'lq_premium_monthly',
    yearly: 'lq_premium_yearly'
  },
  
  // Offering identifier - the default offering in RevenueCat
  defaultOfferingId: 'default'
} as const;

// Package types for easier reference
export type ProductType = keyof typeof REVENUECAT_CONFIG.products;

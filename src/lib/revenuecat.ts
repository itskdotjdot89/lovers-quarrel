// RevenueCat Configuration
// This file contains all RevenueCat-related configuration constants

export const REVENUECAT_CONFIG = {
  // API Keys - Use your app-specific keys from RevenueCat dashboard
  // This is the iOS API key (also works for Android if configured)
  apiKey: 'test_JClmEDorZgpEYhnbveeKfuFxvNx',
  
  // Entitlement identifier - configure this in RevenueCat dashboard
  // Users with this entitlement have premium access
  entitlementId: 'lovers_quarrel_pro',
  
  // Product identifiers - these should match your App Store Connect / Play Console products
  products: {
    monthly: 'lq_premium_monthly',
    yearly: 'lq_premium_yearly'
  },
  
  // Offering identifier - the default offering in RevenueCat
  defaultOfferingId: 'default'
} as const;

// Package types for easier reference
export type ProductType = keyof typeof REVENUECAT_CONFIG.products;

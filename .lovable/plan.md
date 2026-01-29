
# Fix RevenueCat "Purchases must be configured" Error on iOS

## Problem Identified

The Xcode console shows repeated errors: `Purchases must be configured before calling this function`. This happens because:

1. **Missing initialization check**: The `getCustomerInfo()` and `checkEntitlement()` functions call RevenueCat methods without first checking if the SDK has been initialized
2. **Race condition**: `SubscriptionContext` and `useRevenueCat` both try to check subscription status, but RevenueCat may not be configured yet
3. **Possible missing API key**: The `VITE_REVENUECAT_API_KEY` environment variable might not be embedded in the native build

## Solution Overview

### Step 1: Add Initialization Check to `getCustomerInfo`

Update `src/lib/revenuecat.ts` to check `isInitialized` before calling `Purchases.getCustomerInfo()`:

```typescript
export const getCustomerInfo = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  
  // Add this check to prevent "not configured" error
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
```

### Step 2: Update SubscriptionContext to Support Native Platforms

Modify `src/contexts/SubscriptionContext.tsx` to:
- Detect if running on native platform
- Use RevenueCat for subscription checks on iOS instead of the edge function
- Prevent the Stripe edge function from being called on native platforms

```text
Key changes:
┌─────────────────────────────────────────────────────────────┐
│ SubscriptionContext                                         │
├─────────────────────────────────────────────────────────────┤
│ • Import Capacitor and RevenueCat functions                 │
│ • Check isNative before calling edge function               │
│ • On native: use checkEntitlement() from RevenueCat         │
│ • On web: use existing Stripe edge function                 │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Verify Environment Variable is Embedded

Ensure `.env` file exists at project root with:
```
VITE_REVENUECAT_API_KEY=appl_your_actual_key_here
```

Then rebuild:
```bash
npm run build
npx cap sync ios
```

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/revenuecat.ts` | Add `isInitialized` check to `getCustomerInfo()` |
| `src/contexts/SubscriptionContext.tsx` | Add native platform detection, use RevenueCat on iOS |

### Why This Fixes the Issue

1. **Prevents premature SDK calls**: Adding initialization checks stops the "not configured" error
2. **Correct subscription flow on iOS**: Uses RevenueCat entitlements instead of Stripe edge function
3. **Eliminates repeated errors**: Gracefully handles uninitialized state

## After Implementation

Rebuild and test:
```bash
npm run build
npx cap sync ios
```

In Xcode:
1. Clean Build Folder (`Cmd+Shift+K`)
2. Run (`Cmd+R`)

You should see in the console:
- `[RevenueCat] API Key present: true`
- `[RevenueCat] Initialized successfully`
- `[RevenueCat] Offerings loaded: true`

And the pricing page should display the correct price from RevenueCat.

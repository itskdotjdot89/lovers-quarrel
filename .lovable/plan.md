
# Fix: Whitelisted Accounts Bypassed on iOS

## Problem
On iOS, the subscription check uses RevenueCat exclusively and never calls the backend `check-subscription` function where the premium whitelist lives. Whitelisted users on native devices are incorrectly treated as free users.

## Solution
On native platforms, call the backend `check-subscription` edge function **first** to check the whitelist. Only fall back to RevenueCat if the user is not whitelisted (i.e., the backend returns `subscribed: false`).

## Changes

### File: `src/contexts/SubscriptionContext.tsx`

Update the `checkSubscription` function logic:

1. **Always call the `check-subscription` edge function first**, regardless of platform
2. If the backend says the user is subscribed (whitelist or Stripe), use that result
3. **Only if** the backend says NOT subscribed **and** we're on a native platform, then check RevenueCat as a secondary source
4. This ensures the whitelist works on all platforms while still supporting RevenueCat IAP on iOS

```text
Current flow (broken):
  Native? --> RevenueCat only --> DONE (whitelist never checked)
  Web?    --> Edge function   --> DONE

New flow (fixed):
  All platforms --> Edge function first
    --> If subscribed (whitelist/Stripe): DONE
    --> If NOT subscribed AND native: check RevenueCat
    --> Otherwise: not subscribed
```

This is a single-file change with no database or edge function modifications needed.

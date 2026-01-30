

# Apple Review IAP Testing - No Code Changes Needed

## Current Architecture (iOS)

```text
User logs in (demo@loversquarrel.com)
              │
              ▼
      ┌───────────────────────┐
      │ SubscriptionContext   │
      │ checks: isNative?     │
      └───────────┬───────────┘
                  │
                 YES (iOS)
                  │
                  ▼
      ┌───────────────────────┐
      │ RevenueCat SDK        │
      │ checkEntitlement()    │
      │                       │
      │ Returns: false        │
      │ (no purchase yet)     │
      └───────────┬───────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │ User sees Pricing.tsx │
      │ with "Start Trial"    │
      └───────────┬───────────┘
                  │
       User taps Subscribe
                  │
                  ▼
      ┌───────────────────────┐
      │ purchase(offerings[0])│
      │                       │
      │ Native Apple sheet    │
      │ (Sandbox during       │
      │  App Review)          │
      └───────────┬───────────┘
                  │
      Completes sandbox purchase
                  │
                  ▼
      ┌───────────────────────┐
      │ RevenueCat grants     │
      │ entitlement           │
      │                       │
      │ isPremium = true      │
      └───────────────────────┘
```

## Why No Code Changes Are Needed

The `check-subscription` edge function whitelist is **only used on web** (Stripe flow). On iOS:

| Platform | Subscription Check | Whitelist Used? |
|----------|-------------------|-----------------|
| Web | Stripe edge function | Yes |
| iOS | RevenueCat SDK | No |

Since Apple reviewers test on iOS, they will:
1. See the pricing page (RevenueCat returns `isPremium: false`)
2. Tap "Start 7-Day Free Trial"
3. See Apple's native purchase sheet in **Sandbox mode**
4. Complete the sandbox purchase (no real charge)
5. RevenueCat grants the entitlement
6. Access all premium features

## App Store Connect Setup Required

For Apple reviewers to test IAP, ensure these are configured:

### 1. Sandbox Test Account (App Store Connect)
- Go to **Users and Access** → **Sandbox** → **Testers**
- Create or verify a sandbox tester account exists
- Apple reviewers use their own sandbox accounts, but having one ensures the flow works

### 2. Demo Account Credentials (App Review Information)
Provide in App Store Connect under **App Review Information**:
- **Demo Account:** demo@loversquarrel.com
- **Password:** AppleReview2025!

### 3. Review Notes
Add this note in App Store Connect:

```
To test the subscription:
1. Sign in with the demo account provided
2. Navigate to Settings → Subscription (or tap any locked feature)
3. Tap "Start 7-Day Free Trial" 
4. Complete the purchase using your sandbox Apple ID
5. The subscription will activate immediately

Note: This app uses RevenueCat for subscription management with Apple In-App Purchase.
```

## Summary

| Item | Status |
|------|--------|
| IAP flow via RevenueCat | ✅ Already working |
| Demo account can see pricing | ✅ Yes (RevenueCat returns not subscribed) |
| Demo account can test purchase | ✅ Yes (sandbox purchase flow) |
| Whitelist change needed | ❌ Not needed for iOS |

**No code changes required** - the current implementation correctly allows Apple reviewers to test the full IAP purchase flow on iOS.


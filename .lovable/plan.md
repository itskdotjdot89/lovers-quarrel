

# Keep Custom Pricing UI with RevenueCat Purchase Flow

## What You Want

Keep your beautiful custom `/pricing` page design, but when the user taps "Start 7-Day Free Trial" on iOS, it triggers RevenueCat's native App Store purchase sheet directly (not RevenueCat's paywall UI).

## How It Works

```text
User taps "Start 7-Day Free Trial"
              │
              ▼
      ┌───────────────┐
      │  Is iOS/Native?│
      └───────┬───────┘
              │
      ┌───────┴───────┐
     YES              NO
      │               │
      ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ RevenueCat  │  │ Stripe Checkout │
│ purchase()  │  │ (existing flow) │
│             │  │                 │
│ Shows native│  │                 │
│ App Store   │  │                 │
│ sheet only  │  │                 │
└──────┬──────┘  └─────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Apple's native purchase │
│ confirmation sheet      │
│ (Touch ID / Face ID)    │
└─────────────────────────┘
```

## Implementation

### File: `src/pages/Pricing.tsx`

**Current behavior (lines 100-139):**
The `handleSubscribe` function currently calls `showPaywall()` first, which opens RevenueCat's full native paywall UI.

**New behavior:**
Change `handleSubscribe` to call `purchase(offerings[0])` directly on iOS, which:
- Keeps your custom React pricing UI visible
- Only triggers Apple's native purchase confirmation sheet
- Handles the purchase result and navigates accordingly

### Code Change

Replace the iOS handling in `handleSubscribe` to skip the paywall and purchase directly:

```typescript
const handleSubscribe = async () => {
  if (!user) {
    navigate('/auth');
    return;
  }

  setLoading(true);

  try {
    // On native iOS, use RevenueCat direct purchase
    if (isNative) {
      if (offerings.length > 0) {
        const success = await purchase(offerings[0]);
        if (success) {
          await checkSubscription();
          toast({
            title: 'Welcome to Premium!',
            description: 'Your subscription is now active.'
          });
          navigate('/home');
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No subscription options available. Please try again.'
        });
      }
      return;
    }

    // On web, use Stripe (unchanged)
    // ... existing Stripe code
  } catch (error) {
    // ... existing error handling
  } finally {
    setLoading(false);
  }
};
```

### Also Remove Unused Function

The `handleShowPaywall` function (lines 64-98) can be removed since it's no longer needed - it was calling RevenueCat's native paywall which we're bypassing.

## User Experience After Change

1. User sees your custom `/pricing` page design
2. User taps "Start 7-Day Free Trial"
3. Apple's native purchase sheet slides up (Face ID/Touch ID confirmation)
4. After successful purchase, navigates to `/home` with success toast

## Summary of Changes

| Change | Description |
|--------|-------------|
| Modify `handleSubscribe` | Use `purchase(offerings[0])` directly instead of `showPaywall()` |
| Remove `handleShowPaywall` | No longer needed since we're not using RevenueCat's paywall UI |
| Add error handling | Show toast if no offerings are available |


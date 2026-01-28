
# App Store Rejection Fix Plan

## Overview
This plan addresses all four iOS App Store rejection issues from Guideline 3.1.1 (payments), Guideline 2.3.6 (metadata), Guideline 2.3.3 (screenshots), and Guideline 5.1.1(v) (account deletion).

---

## Issue 1: Guideline 3.1.1 - In-App Purchase Requirement (CODE FIX REQUIRED)

### Problem
The `ManageSubscription.tsx` page exposes Stripe payment management to iOS users, which violates Apple's payment guidelines. iOS users can access the "Manage Payment & Billing" button that opens the Stripe Customer Portal.

### Solution
Update **ManageSubscription.tsx** to conditionally hide Stripe-related UI elements when running on iOS/native. For native users, redirect them to iOS System Settings for subscription management.

### Changes Required

**File: `src/pages/ManageSubscription.tsx`**
1. Import the `useRevenueCat` hook to detect native platform
2. Conditionally render the "Manage Payment & Billing" button:
   - **Native (iOS)**: Show a button that explains subscriptions are managed via iOS Settings, or use RevenueCat's Customer Center
   - **Web**: Show the existing Stripe portal button
3. Hide "Change Plan" button on iOS (since plan changes go through App Store)

### Updated Logic
```text
+---------------------------+
|  Is user on native iOS?   |
+---------------------------+
        |           |
       YES         NO
        |           |
        v           v
  Show iOS         Show Stripe
  Settings link    Portal button
  or Customer 
  Center button
```

---

## Issue 2: Guideline 2.3.6 - Age Rating Metadata (APP STORE CONNECT FIX)

### Problem
The app's Age Rating indicates "In-App Controls" (Parental Controls or Age Assurance), but the app only has an age verification gate (`AgeGate.tsx`), not actual parental controls.

### Solution
This is a **metadata-only fix** in App Store Connect - no code changes needed.

### Action Required
1. Log into App Store Connect
2. Navigate to your app → App Information → Age Rating
3. Set **Parental Controls** to "None"
4. Set **Age Assurance** to "None"
5. Keep the 17+ age rating due to adult content

---

## Issue 3: Guideline 2.3.3 - Screenshots (APP STORE CONNECT FIX)

### Problem
The 6.5-inch iPhone screenshots show marketing materials instead of the actual app in use.

### Solution
This is a **metadata-only fix** in App Store Connect - no code changes needed.

### Action Required
1. Take new screenshots showing the app's actual UI:
   - Gameplay screen with cards visible
   - Deck selection screen
   - Settings screen
   - AI Analysis feature in use
2. Upload to App Store Connect under App Previews and Screenshots
3. Ensure screenshots match the 6.5-inch iPhone display (iPhone 15 Pro Max, 14 Plus, etc.)

---

## Issue 4: Guideline 5.1.1(v) - Account Deletion (VERIFICATION NEEDED)

### Current State
The app **already has** account deletion functionality:
- **UI**: Settings page → Account Management section → "Delete Account" button
- **Backend**: `delete-account` edge function that removes all user data and auth record

### Potential Issues
The reviewer may not have found it because:
1. The user needs to be logged in to see the Account Management section
2. The "Delete Account" button is at the bottom of Settings

### Solution
Make account deletion more discoverable and respond to Apple with navigation instructions.

### Optional Enhancement
Add a more prominent visual indicator or move the Account Management section higher in Settings for better visibility.

---

## Implementation Summary

| Issue | Type | Action |
|-------|------|--------|
| 3.1.1 Payments | Code Fix | Hide Stripe UI on iOS in ManageSubscription.tsx |
| 2.3.6 Age Rating | Metadata | Update Age Rating in App Store Connect |
| 2.3.3 Screenshots | Metadata | Upload new in-app screenshots to App Store Connect |
| 5.1.1(v) Account Deletion | Response | Reply to Apple with location details; optionally improve visibility |

---

## Files to Modify

1. **`src/pages/ManageSubscription.tsx`**
   - Import `useRevenueCat` hook
   - Add platform detection
   - Conditionally render subscription management UI:
     - iOS: RevenueCat Customer Center or iOS Settings link
     - Web: Existing Stripe portal

2. **`src/pages/Settings.tsx`** (Optional)
   - Consider moving Account Management section higher for visibility
   - Add a clearer visual indicator for the Delete Account option

---

## Reply to Apple (Suggested Text)

For Guideline 5.1.1(v), include this in your App Store Connect response:

> "The account deletion feature is located in the app at:
> 1. Sign in to the app
> 2. Tap the 'Profile' button (top right on Home screen) or navigate to Settings
> 3. Scroll to 'Account Management' section at the bottom
> 4. Tap 'Delete Account' button (red button with trash icon)
> 5. Confirm deletion in the dialog
> 
> Test account: demo@loversquarrel.com / AppleReview2025!"

---

## Technical Details

### ManageSubscription.tsx Changes

The page will detect the platform using `useRevenueCat`:

```typescript
const { isNative, isReady, presentCustomerCenter } = useRevenueCat();
```

For native users, replace the Stripe portal button with:
1. A button to open RevenueCat Customer Center, OR
2. A message explaining subscriptions are managed via iOS Settings

The "Change Plan" button will also be hidden on iOS since App Store subscriptions are managed through Apple's subscription settings.

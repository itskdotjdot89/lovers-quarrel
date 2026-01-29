

# User Flow Improvements Plan

## Overview

After reviewing the codebase, I've identified several areas where the user flows can be improved for better usability and a smoother experience. This plan covers enhancements across onboarding, authentication, subscription management, navigation, and gameplay flows.

---

## Current Flow Analysis

```text
┌─────────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│   Index     │────▶│ Onboarding│────▶│     Auth     │────▶│ Pricing │
│  (Router)   │     │ (Welcome) │     │ (Sign Up/In) │     │ (Trial) │
└─────────────┘     └───────────┘     └──────────────┘     └─────────┘
                                                                │
                                                                ▼
┌─────────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│  Gameplay   │◀────│   Decks   │◀────│     Home     │◀────│ Success │
│   (Cards)   │     │ Selection │     │   (Menu)     │     │         │
└─────────────┘     └───────────┘     └──────────────┘     └─────────┘
```

---

## Issues Identified and Solutions

### 1. Authentication Flow Improvements

**Current Issues:**
- No "Forgot Password" functionality
- No loading states during auth operations
- Sign-up success message doesn't explain email confirmation process
- Terms/Privacy links mentioned but not clickable in onboarding

**Improvements:**
- Add password reset functionality with "Forgot Password?" link
- Add clear feedback after sign-up about email confirmation (if enabled)
- Make Terms of Service and Privacy Policy links functional in onboarding trial prompt
- Add more informative loading states

### 2. Pricing Page Enhancements

**Current Issues:**
- On iOS, the Stripe price hardcode `$4.99` shows when RevenueCat hasn't loaded yet
- No back/close button to exit the pricing page
- Missing App Store compliance text about subscriptions auto-renewing
- Price display says "$5-8/month" in onboarding but "$4.99/month" on pricing page (inconsistency)

**Improvements:**
- Add back navigation button
- Add App Store compliance disclosure text about auto-renewal billing
- Fix price consistency across screens
- Show skeleton/loading state while fetching RevenueCat prices

### 3. Navigation Consistency

**Current Issues:**
- Settings "back" button goes to "/" but should go to "/home"
- Some pages lack clear back navigation
- Home button icon changes between User and LogIn based on auth state which may confuse users

**Improvements:**
- Standardize back navigation across all pages
- Consider always showing Settings icon on Home (it works for both logged in and logged out states)

### 4. Onboarding Flow Polish

**Current Issues:**
- Price shown as "$5-8/month" is vague
- "Already have an account?" button goes to /auth without preserving context
- Terms/Privacy text is not interactive

**Improvements:**
- Display accurate pricing from RevenueCat or use consistent fallback
- Preserve "from=onboarding" context when signing in
- Make Terms and Privacy links clickable with navigation

### 5. Subscription Management

**Current Issues:**
- ManageSubscription page queries database `subscriptions` table but RevenueCat users won't have records there
- On native (iOS), should use RevenueCat Customer Center instead of Stripe portal
- "Change Plan" button navigates to pricing but there's only one plan

**Improvements:**
- Platform-aware subscription management (RevenueCat on iOS, Stripe on web)
- Remove "Change Plan" button since only one tier exists
- Show subscription status from the correct source (RevenueCat vs Stripe)

### 6. Error Handling and Edge Cases

**Current Issues:**
- Console shows repeated subscription check errors (edge function returning non-2xx)
- No offline state handling
- No retry mechanism for failed API calls

**Improvements:**
- Add error boundaries for graceful error handling
- Implement better retry logic with exponential backoff
- Add user-friendly error messages

### 7. iOS-Specific Compliance

**Current Issues:**
- Pricing page needs App Store subscription disclosure text
- "Restore Purchases" is present (good)
- Need to ensure paywall close button is visible

**Improvements:**
- Add required legal text: "Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period."
- Verify paywall has dismiss capability (already set with `displayCloseButton: true`)

---

## Technical Implementation

### Phase 1: Authentication Improvements

**File: `src/pages/Auth.tsx`**
- Add "Forgot Password?" link with password reset flow
- Improve loading states with skeleton UI
- Add clearer success/error messaging

### Phase 2: Pricing Page Updates

**File: `src/pages/Pricing.tsx`**
- Add back/close navigation button
- Add App Store compliance disclosure
- Fix loading skeleton for prices
- Standardize pricing display

### Phase 3: Onboarding Polish

**File: `src/pages/Onboarding.tsx`**
- Make Terms/Privacy links clickable
- Fix "Already have an account?" to preserve context
- Use consistent pricing text

### Phase 4: Navigation Fixes

**File: `src/pages/Settings.tsx`**
- Change back button to navigate to "/home"

**File: `src/pages/ManageSubscription.tsx`**
- Make platform-aware (RevenueCat on iOS, Stripe on web)
- Remove "Change Plan" option

### Phase 5: Error Handling

**File: `src/contexts/SubscriptionContext.tsx`**
- Add retry logic with backoff
- Reduce check frequency to prevent rate limiting
- Handle edge function errors gracefully

---

## Summary of Changes

| Area | Change | Priority |
|------|--------|----------|
| Auth | Add Forgot Password | Medium |
| Pricing | Add back button | High |
| Pricing | Add App Store disclosure | High (iOS compliance) |
| Onboarding | Make legal links clickable | High (compliance) |
| Onboarding | Fix pricing consistency | Medium |
| Settings | Fix back navigation | Low |
| ManageSubscription | Platform-aware subscription management | High |
| SubscriptionContext | Fix repeated API calls/errors | High |

---

## Expected Outcome

After implementation:
- Smooth, intuitive onboarding flow
- Clear subscription management across platforms
- App Store compliance for iOS
- Consistent navigation patterns
- Better error handling and user feedback
- Professional, polished user experience


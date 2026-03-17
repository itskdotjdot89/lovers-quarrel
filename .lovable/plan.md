

# Fix Plan: App Store Rejection (v1.0.4)

There are three issues to address from Apple's review:

---

## Issue 1: Guideline 2.3.2 — Paid Content Not Clearly Labeled

**Problem**: The PaywallOverlay CTA says "Start 7-Day Free Trial" without mentioning the price. The Pricing page mentions paid content but the in-app paywall and other metadata references don't clearly state that a purchase is required.

**Fix (App Store Connect + Code)**:
- **App Store Connect**: Update the app description to clearly state "Subscription required for full access" and include pricing info (e.g., "$4.99/month after 7-day free trial").
- **In-app (PaywallOverlay.tsx)**: Change the CTA button from "Start 7-Day Free Trial" to include the price, e.g., "Try Free, then $4.99/month". Add a line stating "Subscription required — $4.99/month after 7-day free trial."
- **Feature list references**: Anywhere features are listed as included (e.g., "All 3 decks (600 cards)"), ensure it's clear these are premium features requiring a subscription.

---

## Issue 2: Guideline 1.1 — Objectionable Content in Description

**Problem**: The app description on App Store Connect contains terms Apple considers objectionable (likely references to "Strip" in "Say/Sip/Strip", or sensual/intimate language).

**Fix (App Store Connect only — no code change needed)**:
- Rewrite the App Store description to remove or soften any references to "strip", "sensual", "intimate" content, or adult themes.
- Use neutral language: "conversation starters", "relationship-building", "fun challenges" instead of suggestive terms.
- Remove any mention of the "Strip it" mechanic from the description. The feature can exist in-app but should not be marketed in metadata.
- Avoid words like: "sensual", "strip", "sexy", "spicy", "adult", "erotic".

---

## Issue 3: Guideline 2.1(a) — Microphone Bug on iPad

**Problem**: Tapping the microphone button shows an error ("Could not access microphone" as seen in the screenshot). This happens in `OpenEndedInput.tsx` and `GameCard.tsx` when `navigator.mediaDevices.getUserMedia` fails.

**Root cause**: The error is thrown without graceful handling. On iPad, this could fail if:
1. The app lacks the `NSMicrophoneUsageDescription` key in `Info.plist` (most likely cause).
2. The user denies permission and the error toast is jarring.
3. The `getUserMedia` API isn't available in the WKWebView context without proper Capacitor plugin.

**Fix (Code + Native config)**:

1. **Capacitor native config**: Ensure `ios/App/App/Info.plist` has `NSMicrophoneUsageDescription` set. This is configured outside Lovable (in Xcode). Instruct user to verify.

2. **Graceful fallback in code**: In `OpenEndedInput.tsx` and `GameCard.tsx`, check if `navigator.mediaDevices` is available before attempting to record. If unavailable (common in native WebView without the right plugin), hide the microphone button entirely instead of showing it and erroring.

3. **Install `@capacitor/microphone` or `@capacitor-community/speech-recognition`**: The native Capacitor environment may need a plugin to properly request microphone permissions. Alternatively, check permissions before showing the mic button.

**Code changes**:
- Create a utility function `isMicrophoneAvailable()` that checks `navigator.mediaDevices?.getUserMedia` availability.
- In `OpenEndedInput.tsx`, `GameCard.tsx`, and `SimpleAudioRecorder.tsx`: conditionally render the mic button only when microphone is available.
- Wrap `getUserMedia` calls with better error handling that distinguishes between "permission denied" vs "not supported" and shows appropriate messages.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/OpenEndedInput.tsx` | Hide mic button if not available; improve error handling |
| `src/components/GameCard.tsx` | Hide mic button if not available; improve error handling |
| `src/components/SimpleAudioRecorder.tsx` | Hide mic button if not available |
| `src/components/PaywallOverlay.tsx` | Add price to CTA, clarify subscription required |
| **App Store Connect** (manual) | Rewrite description removing objectionable terms; add subscription pricing disclosure |


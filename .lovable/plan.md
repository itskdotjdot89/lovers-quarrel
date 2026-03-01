
# Fix Couples Play and Forgot Password for iOS

## Issue 1: Couples Play - Realtime Card Sync Broken

**Root cause**: In `Gameplay.tsx`, `subscribeToSession()` is called once on mount (line 87) but captures `cards` in its closure when `cards` is still an empty array. When the host advances cards, the non-host player's realtime handler runs `cards[newIndex]` against `[]` and gets `undefined`, so `setCurrentCard` is never called. The non-host sees the same card forever.

**Fix**:
- Refactor `subscribeToSession()` to use a `useRef` for `cards` so the realtime callback always reads the latest value
- Alternatively, re-subscribe when `cards` changes (simpler but more reconnects)
- Also: the `handleCancelSession` calls DELETE on `game_sessions` but there's no DELETE RLS policy, so cancellation silently fails -- add a DELETE policy for the host

**Changes**:
- `src/pages/Gameplay.tsx`: Add a `cardsRef` that stays in sync with `cards` state, use it inside the realtime handler
- Database migration: Add DELETE policy on `game_sessions` for host

## Issue 2: Forgot Password Email Not Working on iOS

**Root causes**:
1. The password reset redirect URL uses `window.location.origin` which resolves to `capacitor://localhost` inside the native iOS app -- this is not a valid HTTP URL that email links can open
2. There is no `/reset-password` page that handles the recovery token and lets the user set a new password. The current redirect goes to `/auth` which just shows the login form
3. No custom email domain is configured, so password reset emails may go to spam or not be sent

**Fix**:
- Use the **published web URL** (`https://lovers-whispers-app.lovable.app`) as the redirect target instead of `window.location.origin` for password reset
- Create a new `/reset-password` page that:
  - Detects the `type=recovery` hash parameter from the email link
  - Shows a "set new password" form
  - Calls `supabase.auth.updateUser({ password })` to complete the reset
  - Redirects to the login page on success
- Add the `/reset-password` route to `App.tsx`

**Changes**:
- `src/pages/Auth.tsx`: Change `redirectTo` in `resetPasswordForEmail` to use the published URL + `/reset-password`
- `src/pages/ResetPassword.tsx`: New page with password update form
- `src/App.tsx`: Add `/reset-password` route

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/Gameplay.tsx` | Fix stale closure bug with `useRef` for cards array; realtime handler uses ref |
| `src/pages/Auth.tsx` | Update reset password redirect URL to published web URL + `/reset-password` |
| `src/pages/ResetPassword.tsx` | New page: handle recovery token, show new password form, call `updateUser` |
| `src/App.tsx` | Add `/reset-password` route |
| Database migration | Add DELETE policy on `game_sessions` for host (`auth.uid() = host_id`) |

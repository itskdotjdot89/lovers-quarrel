

# Add Email to Premium Whitelist

## Change
Add `kjshotme@gmail.com` to the `premiumWhitelist` array in `supabase/functions/check-subscription/index.ts`.

## Technical Detail
The whitelist is at ~line 68 in the edge function. The email will be appended to the existing array. Once deployed, this user will immediately have full premium access without needing a Stripe subscription or RevenueCat entitlement.

## Files Modified
- `supabase/functions/check-subscription/index.ts` — add one email to the whitelist array


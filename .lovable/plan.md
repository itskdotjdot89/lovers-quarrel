

# Speed Up Couples Mode Sync for Joining Player

## Problem
The joining player currently waits up to 3 seconds to see the next card because the fallback polling interval is fixed at 3000ms. On iOS, Realtime websocket events can be delayed or missed, making the polling the primary sync mechanism.

## Solution
Replace the fixed 3-second polling with aggressive initial polling that backs off over time, and also make the Realtime handler more reliable.

## Changes

### File: `src/pages/Gameplay.tsx`

1. **Reduce initial poll interval to 1 second** -- when the host advances, the joining player will catch up within ~1s instead of ~3s
2. **Add exponential backoff** -- after detecting no change, gradually increase the interval (1s -> 1.5s -> 2.25s -> max 5s) to reduce unnecessary network calls
3. **Reset interval on change** -- when a new card index is detected (via poll or Realtime), reset the poll interval back to 1s for fast response on the next advance
4. **Use `setTimeout` instead of `setInterval`** -- allows dynamic interval adjustment between polls

The Realtime subscription remains as-is (it already works correctly when events arrive). This change makes the fallback faster while still being efficient with network usage.

### Technical Detail

```text
Current:  Fixed 3s poll --> worst case 3s delay
Proposed: 1s poll, backs off to 5s when idle, resets to 1s on change
          --> worst case ~1s delay on card advance
```

The implementation will use `useRef` for the poll interval and a recursive `setTimeout` pattern, cleaning up on unmount. The backoff caps at 5 seconds (not 30s) since gameplay sessions are active and short-lived.


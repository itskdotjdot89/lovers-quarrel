

## Fix: AI Analysis Getting Stuck on Same Answer in Couples Mode

### Problem
The `RoundComparison` component's `useEffect` that fetches the AI analysis only depends on `[card.id]`. The helper function `getResponseText` (which reads `player1Response` and `player2Response`) is called inside the effect but isn't listed as a dependency. This means if the component remounts or re-renders with different responses, the effect either doesn't re-fire or captures stale response data.

Additionally, there's no `key` prop on the `<RoundComparison>` component in `Gameplay.tsx`, so React may reuse the same instance across rounds, keeping the old `synopsis` state.

### Fix (2 files, ~3 lines changed)

**1. `src/pages/Gameplay.tsx`** — Add a `key` prop to force full remount each round:
```tsx
<RoundComparison
  key={currentCard.id}
  card={currentCard}
  ...
```
This ensures React destroys and recreates the component (and its state) for each new card, triggering a fresh `useEffect` with the correct response data.

**2. `src/components/RoundComparison.tsx`** — Expand the `useEffect` dependency array to include the actual response values, as a safety net:
```tsx
useEffect(() => {
  // ... fetchInsights
}, [card.id, player1Response.choice, player1Response.responseText, player2Response.choice, player2Response.responseText]);
```
Also reset `synopsis` to `null` at the start of the effect so stale data doesn't linger if the effect re-runs.

### Why this works
- The `key` prop guarantees a clean component instance per card — fresh state, fresh effect.
- The expanded dependencies ensure that even if the same card ID appears, changed responses trigger a new analysis.
- Resetting `synopsis` prevents showing a previous card's analysis while the new one loads.


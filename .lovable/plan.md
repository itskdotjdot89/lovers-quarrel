

## Show Text Input When "Say It" Is Selected

**Problem**: On Say/Sip/Strip cards, selecting "Say it" immediately records the choice and advances. There's no place to type what you actually want to say -- the text box only appears later in the optional AI analysis prompt (solo mode only), and doesn't exist at all in couples mode.

**Solution**: When "Say it" is tapped, instead of immediately submitting, show a text input area directly on the card so the player can type (or voice-record) their response before advancing.

---

### How It Will Work

1. Tapping "Say it" transitions the card into a "response mode" showing a text area with mic button
2. Tapping "Sip it" or "Strip it" works as before (immediate action)
3. After typing/recording, a "Submit" button sends the response and advances

### Technical Changes

**GameCard.tsx**
- Add state to track when "Say it" is selected: `showSayItInput`
- When "Say it" is clicked, show a text area + mic button + submit button instead of immediately calling `onChoice`
- Add new prop `onSayItSubmit` for submitting text along with the choice
- "Sip it" and "Strip it" continue to call `onChoice` directly

**Gameplay.tsx**
- Handle the new `onSayItSubmit` callback from GameCard
- Pass the typed text as `responseText` when storing the response (couples mode) or setting `pendingChoice` (solo mode)
- Remove the duplicate "Say it" text input from the AI analysis prompt section (lines 700-733) since it will now live on the card itself
- Clean up the `sayItResponse`, recording refs, and related state that move into GameCard

This keeps the flow intuitive: tap "Say it" -> type/speak -> submit, all on the same card view.

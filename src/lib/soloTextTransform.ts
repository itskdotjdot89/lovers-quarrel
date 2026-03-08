import { Card } from '@/types/game';

/**
 * Transforms card text to 1st person for solo mode.
 * Returns a new card object with adapted text (does not mutate original).
 */
export function transformCardForSolo(card: Card): Card {
  return {
    ...card,
    text: toFirstPerson(card.text),
    choiceA: card.choiceA ? toFirstPerson(card.choiceA) : card.choiceA,
    choiceB: card.choiceB ? toFirstPerson(card.choiceB) : card.choiceB,
  };
}

function toFirstPerson(text: string): string {
  let result = text;

  // "your partner" → "my partner"
  result = result.replace(/\byour partner\b/gi, (m) => matchCase(m, 'my partner'));
  // "your" (standalone, not followed by "self") → "my"
  result = result.replace(/\byour(?!self)\b/gi, (m) => matchCase(m, 'my'));
  // "you're" → "I'm"
  result = result.replace(/\byou're\b/gi, (m) => matchCase(m, "I'm"));
  // "you've" → "I've"
  result = result.replace(/\byou've\b/gi, (m) => matchCase(m, "I've"));
  // "you'd" → "I'd"
  result = result.replace(/\byou'd\b/gi, (m) => matchCase(m, "I'd"));
  // "you'll" → "I'll"
  result = result.replace(/\byou'll\b/gi, (m) => matchCase(m, "I'll"));
  // "do you" → "do I"
  result = result.replace(/\bdo you\b/gi, (m) => matchCase(m, 'do I'));
  // "are you" → "am I"
  result = result.replace(/\bare you\b/gi, (m) => matchCase(m, 'am I'));
  // "have you" → "have I"
  result = result.replace(/\bhave you\b/gi, (m) => matchCase(m, 'have I'));
  // "would you" → "would I"
  result = result.replace(/\bwould you\b/gi, (m) => matchCase(m, 'would I'));
  // "did you" → "did I"
  result = result.replace(/\bdid you\b/gi, (m) => matchCase(m, 'did I'));
  // "can you" → "can I"
  result = result.replace(/\bcan you\b/gi, (m) => matchCase(m, 'can I'));
  // "will you" → "will I"
  result = result.replace(/\bwill you\b/gi, (m) => matchCase(m, 'will I'));
  // Remaining standalone "you" → "I"
  result = result.replace(/\byou\b/gi, (m) => matchCase(m, 'I'));
  // "yourself" → "myself"
  result = result.replace(/\byourself\b/gi, (m) => matchCase(m, 'myself'));
  // "me" at end of sentences referring to partner → keep as-is (contextual, skip)
  // "involving me" is partner-perspective, transform to "involving my partner"
  result = result.replace(/\binvolving me\b/gi, (m) => matchCase(m, 'involving my partner'));

  return result;
}

/** Preserve the case pattern of the original match */
function matchCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

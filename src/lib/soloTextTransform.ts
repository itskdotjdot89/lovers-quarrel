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

  // Contractions first (most specific)
  result = result.replace(/\byou're\b/gi, (m) => matchCase(m, "I'm"));
  result = result.replace(/\byou've\b/gi, (m) => matchCase(m, "I've"));
  result = result.replace(/\byou'd\b/gi, (m) => matchCase(m, "I'd"));
  result = result.replace(/\byou'll\b/gi, (m) => matchCase(m, "I'll"));

  // "yourself" → "myself"
  result = result.replace(/\byourself\b/gi, (m) => matchCase(m, 'myself'));

  // "your partner" → "my partner"
  result = result.replace(/\byour partner\b/gi, (m) => matchCase(m, 'my partner'));
  // "your" → "my"
  result = result.replace(/\byour\b/gi, (m) => matchCase(m, 'my'));

  // "involving me" (partner ref) → "involving my partner"
  result = result.replace(/\binvolving me\b/gi, (m) => matchCase(m, 'involving my partner'));

  // Subject "you" after verbs that indicate subject position → "I"
  result = result.replace(/\bdo you\b/gi, (m) => matchCase(m, 'do I'));
  result = result.replace(/\bare you\b/gi, (m) => matchCase(m, 'am I'));
  result = result.replace(/\bhave you\b/gi, (m) => matchCase(m, 'have I'));
  result = result.replace(/\bwould you\b/gi, (m) => matchCase(m, 'would I'));
  result = result.replace(/\bdid you\b/gi, (m) => matchCase(m, 'did I'));
  result = result.replace(/\bcan you\b/gi, (m) => matchCase(m, 'can I'));
  result = result.replace(/\bwill you\b/gi, (m) => matchCase(m, 'will I'));
  result = result.replace(/\bcould you\b/gi, (m) => matchCase(m, 'could I'));
  result = result.replace(/\bshould you\b/gi, (m) => matchCase(m, 'should I'));

  // Object "you" after prepositions → "me"
  const preps = 'to|for|with|about|from|at|of|between|on|around|toward|towards|into|upon|against|before|after|without|between|means to';
  const prepRegex = new RegExp(`\\b(${preps})\\s+you\\b`, 'gi');
  result = result.replace(prepRegex, (match, prep) => {
    return `${prep} me`;
  });

  // "tell you" / "show you" / "give you" / "ask you" etc. (verb + object you) → "me"
  const objVerbs = 'tell|show|give|ask|teach|bring|send|offer|remind|help|thank|call|make|let|want|need|like|love|see|hear|know|meet|miss|hit|touch|kiss|hold|push|pull|describe|surprise|turn|drive';
  const objVerbRegex = new RegExp(`\\b(${objVerbs})\\s+you\\b`, 'gi');
  result = result.replace(objVerbRegex, (match, verb) => {
    return `${verb} me`;
  });

  // "you" at the start of a sentence or after punctuation → subject "I"
  result = result.replace(/(^|[.!?]\s+)you\b/gi, (match, prefix) => {
    return `${prefix}I`;
  });

  // Remaining "you" — context-dependent; default to "I" for question cards
  // (most cards are "What do you..." style questions where "you" is subject)
  result = result.replace(/\byou\b/gi, (m) => matchCase(m, 'I'));

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

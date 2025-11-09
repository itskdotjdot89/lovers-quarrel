import { Card, Session, SpiceLevel, CardSubtype, DeckMood } from '@/types/game';

// Fisher-Yates shuffle
export function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Filter cards based on session preferences
export function filterCards(
  allCards: Card[],
  deckIds: DeckMood[],
  subtypes: CardSubtype[],
  spice: SpiceLevel
): Card[] {
  const spiceLevels: SpiceLevel[] = ['soft', 'standard', 'spicy'];
  const maxSpiceIndex = spiceLevels.indexOf(spice);
  
  return allCards.filter(card => {
    const meetsSpice = spiceLevels.indexOf(card.spice) <= maxSpiceIndex;
    const meetsDeck = deckIds.includes(card.deckId);
    const meetsSubtype = subtypes.length === 0 || subtypes.includes(card.subtype);
    const isActive = card.isActive;
    
    return meetsSpice && meetsDeck && meetsSubtype && isActive;
  });
}

// Get current card from session
export function getCurrentCard(cards: Card[], session: Session): Card | null {
  if (session.currentCardIndex >= cards.length) return null;
  return cards[session.currentCardIndex];
}

// Check if session is complete
export function isSessionComplete(cards: Card[], session: Session): boolean {
  return session.currentCardIndex >= cards.length;
}

// Save favorites to localStorage
export function saveFavorites(favorites: string[]) {
  localStorage.setItem('lq_favorites', JSON.stringify(favorites));
}

// Load favorites from localStorage
export function loadFavorites(): string[] {
  const stored = localStorage.getItem('lq_favorites');
  return stored ? JSON.parse(stored) : [];
}

// Toggle favorite
export function toggleFavorite(cardId: string, favorites: string[]): string[] {
  if (favorites.includes(cardId)) {
    return favorites.filter(id => id !== cardId);
  }
  return [...favorites, cardId];
}

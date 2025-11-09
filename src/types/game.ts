export type DeckMood = 'freaky' | 'real_talk' | 'love_drunk';
export type CardSubtype = 'this_or_that' | 'open_ended' | 'say_sip_strip';
export type SpiceLevel = 'soft' | 'standard' | 'spicy';
export type GameMode = 'date_night' | 'party' | 'long_distance' | 'solo';

export interface Deck {
  id: DeckMood;
  name: string;
  description: string;
  mood: DeckMood;
  isPremium: boolean;
  order: number;
  cardCount: number;
}

export interface Card {
  id: string;
  deckId: DeckMood;
  subtype: CardSubtype;
  text: string;
  choiceA?: string;
  choiceB?: string;
  spice: SpiceLevel;
  tags?: string[];
  isActive: boolean;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  emoji?: string;
}

export interface Session {
  id: string;
  mode: GameMode;
  deckIds: DeckMood[];
  subtypes: CardSubtype[];
  spice: SpiceLevel;
  players: Player[];
  playedCardIds: string[];
  favorites: string[];
  choices: Record<string, 'A' | 'B' | null>;
  createdAt: number;
  currentCardIndex: number;
}

export interface UserPreferences {
  hasSeenAgeGate: boolean;
  intensity: SpiceLevel;
  consentGiven: boolean;
  favorites: string[];
}

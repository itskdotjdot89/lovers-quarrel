import { Deck } from '@/types/game';

export const DECKS: Deck[] = [
  {
    id: 'freaky',
    name: 'Freaky',
    description: 'Kink, desire, seduction',
    mood: 'freaky',
    isPremium: false,
    order: 1,
    cardCount: 200,
  },
  {
    id: 'real_talk',
    name: 'Real Talk',
    description: 'Truth, psychology, conflict resolution',
    mood: 'real_talk',
    isPremium: false,
    order: 2,
    cardCount: 200,
  },
  {
    id: 'love_drunk',
    name: 'Love Drunk',
    description: 'Romance, devotion, emotional intimacy',
    mood: 'love_drunk',
    isPremium: false,
    order: 3,
    cardCount: 200,
  },
];

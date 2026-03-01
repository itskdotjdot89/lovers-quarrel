import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FREE_CARD_LIMIT = 20; // Number of cards free users can view before paywall
const STORAGE_KEY = 'lq_cards_viewed';

interface FreemiumLimitResult {
  cardsViewed: number;
  freeCardsRemaining: number;
  shouldShowPaywall: boolean;
  recordCardView: () => boolean; // Returns false if paywall should show
  resetCardViews: () => void;
  FREE_CARD_LIMIT: number;
}

export function useFreemiumLimit(): FreemiumLimitResult {
  const { isPremium, loading } = useSubscription();
  const [cardsViewed, setCardsViewed] = useState(0);

  // Load cards viewed from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      if (!isNaN(count)) {
        setCardsViewed(count);
      }
    }
  }, []);

  // Record a card view, returns false if paywall should show
  const recordCardView = useCallback((): boolean => {
    // Premium users bypass the limit
    if (isPremium || loading) {
      return true;
    }

    const newCount = cardsViewed + 1;
    
    // If this would exceed the limit, show paywall
    if (newCount > FREE_CARD_LIMIT) {
      return false;
    }

    // Record the view
    setCardsViewed(newCount);
    localStorage.setItem(STORAGE_KEY, newCount.toString());
    return true;
  }, [cardsViewed, isPremium, loading]);

  // Reset card views (useful after subscription)
  const resetCardViews = useCallback(() => {
    setCardsViewed(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Calculate remaining free cards
  const freeCardsRemaining = Math.max(0, FREE_CARD_LIMIT - cardsViewed);
  
  // Should we show paywall?
  const shouldShowPaywall = !isPremium && !loading && cardsViewed >= FREE_CARD_LIMIT;

  return {
    cardsViewed,
    freeCardsRemaining,
    shouldShowPaywall,
    recordCardView,
    resetCardViews,
    FREE_CARD_LIMIT,
  };
}

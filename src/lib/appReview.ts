import { Capacitor } from '@capacitor/core';

const REVIEW_STORAGE_KEY = 'lq_review_state';
const SESSIONS_BEFORE_PROMPT = 3;

interface ReviewState {
  sessionsPlayed: number;
  lastPrompted: string | null;
  hasRated: boolean;
}

function getReviewState(): ReviewState {
  try {
    const stored = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { sessionsPlayed: 0, lastPrompted: null, hasRated: false };
}

function saveReviewState(state: ReviewState) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Request the native in-app review dialog.
 * Falls back to opening the App Store page on web or if the native API fails.
 */
export async function requestAppReview(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AppReview] Not on native platform, skipping');
    return false;
  }

  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    
    const state = getReviewState();
    state.hasRated = true;
    state.lastPrompted = new Date().toISOString();
    saveReviewState(state);
    
    console.log('[AppReview] Review requested successfully');
    return true;
  } catch (error) {
    console.error('[AppReview] Error requesting review:', error);
    return false;
  }
}

/**
 * Record a completed gameplay session and return true if it's a good time to prompt for review.
 */
export function recordSessionAndCheckPrompt(): boolean {
  const state = getReviewState();
  state.sessionsPlayed += 1;
  saveReviewState(state);

  // Don't prompt if user already rated
  if (state.hasRated) return false;

  // Don't prompt too frequently (at most once per 30 days)
  if (state.lastPrompted) {
    const daysSince = (Date.now() - new Date(state.lastPrompted).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) return false;
  }

  // Prompt after every N sessions
  if (state.sessionsPlayed >= SESSIONS_BEFORE_PROMPT && state.sessionsPlayed % SESSIONS_BEFORE_PROMPT === 0) {
    return true;
  }

  return false;
}

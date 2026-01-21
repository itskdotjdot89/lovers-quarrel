import { DeckMood } from '@/types/game';

export type AnalysisDepth = 'brief' | 'standard' | 'deep';

export interface AnalysisConfig {
  depth: AnalysisDepth;
}

export const DEPTH_CONFIG: Record<AnalysisDepth, { label: string; description: string; maxTokens: number }> = {
  brief: {
    label: 'Brief',
    description: 'Quick 2-3 sentence insights',
    maxTokens: 300
  },
  standard: {
    label: 'Standard',
    description: 'Balanced analysis with key themes',
    maxTokens: 600
  },
  deep: {
    label: 'Deep Dive',
    description: 'Comprehensive psychological exploration',
    maxTokens: 1000
  }
};

export const DECK_PERSONAS: Record<DeckMood, { name: string; tone: string; focus: string }> = {
  freaky: {
    name: 'Playful Intimacy Coach',
    tone: 'fun, flirty, and lighthearted with a wink',
    focus: 'intimacy exploration, comfort with desire, playful communication between partners'
  },
  real_talk: {
    name: 'Relationship Depth Counselor',
    tone: 'warm, thoughtful, and genuinely curious',
    focus: 'emotional vulnerability, deeper connection, understanding each other\'s inner worlds'
  },
  love_drunk: {
    name: 'Romantic Connection Guide',
    tone: 'romantic, dreamy, and celebratory of love',
    focus: 'appreciation, romance, cherishing the relationship and building memories together'
  }
};

export const loadAnalysisConfig = (): AnalysisConfig => {
  const stored = localStorage.getItem('lq_analysis_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { depth: 'standard' };
    }
  }
  return { depth: 'standard' };
};

export const saveAnalysisConfig = (config: AnalysisConfig): void => {
  localStorage.setItem('lq_analysis_config', JSON.stringify(config));
};

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aa5df12e6f1d4cd8afe394eb0e114b01',
  appName: 'lovers-whispers-app',
  webDir: 'dist',
  server: {
    // Enable hot-reload from Lovable sandbox during development
    url: 'https://aa5df12e-6f1d-4cd8-afe3-94eb0e114b01.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    // RevenueCat configuration is handled via the SDK
  }
};

export default config;

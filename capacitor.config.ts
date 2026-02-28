import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.AcpcZnwlYJHI.LoversQuarrel',
  appName: 'Lovers Quarrel',
  webDir: 'dist',
  // NOTE: Uncomment for development hot-reload, comment out for production builds
  // server: {
  //   url: 'https://aa5df12e-6f1d-4cd8-afe3-94eb0e114b01.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  ios: {
    contentInset: 'automatic'
  },
  plugins: {
    // RevenueCat configuration is handled via the SDK
  }
};

export default config;

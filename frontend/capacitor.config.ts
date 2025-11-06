import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.receiptlocker.app',
  appName: 'Retreat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'retreat-app.tech',
    cleartext: false,
    // Allow navigation to external URLs (for Clerk OAuth)
    allowNavigation: [
      'https://*.clerk.accounts.dev',
      'https://*.clerk.com',
      'https://retreat-app.tech',
      'https://api.retreat-app.tech'
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#0f172a",
      showSpinner: false
    }
  }
};

export default config;

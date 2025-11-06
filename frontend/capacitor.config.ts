import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.receiptlocker.app',
  appName: 'Retreat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, you can use:
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true // Keep enabled for debugging
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

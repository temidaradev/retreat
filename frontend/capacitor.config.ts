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
    webContentsDebuggingEnabled: true // Temporarily enabled for debugging
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.receiptlocker.app',
  appName: 'Receipt Locker',
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
    webContentsDebuggingEnabled: true
  }
};

export default config;

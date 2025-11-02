import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { config } from './src/config';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const publishableKey = config.clerk.publishableKey;

  if (!publishableKey) {
    console.error('Missing Clerk Publishable Key');
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}


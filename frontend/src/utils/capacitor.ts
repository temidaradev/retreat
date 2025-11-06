import { Capacitor } from '@capacitor/core';

/**
 * Utilities for Capacitor platform detection and handling
 */

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Get platform-specific configuration for Clerk
 */
export const getClerkConfig = () => {
  const platform = getPlatform();
  
  return {
    platform,
    isNative: isNativePlatform(),
    // For Android, we need special handling of OAuth flows
    routingStrategy: platform === 'android' ? 'hash' : 'path',
    // Android needs to handle redirects differently
    afterSignInUrl: platform === 'android' ? '/#/' : '/',
    afterSignUpUrl: platform === 'android' ? '/#/' : '/',
  };
};

/**
 * Handle deep links and OAuth callbacks in native apps
 */
export const handleDeepLink = (url: string): void => {
  if (!isNativePlatform()) {
    return;
  }

  console.log('Deep link received:', url);
  
  // Parse the URL and handle OAuth callbacks
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search || urlObj.hash.substring(1));
  
  // If this is a Clerk callback, let Clerk handle it
  if (params.has('__clerk_status') || params.has('__clerk_created_session')) {
    console.log('Clerk OAuth callback detected');
    // The URL will be processed by Clerk automatically
  }
};

/**
 * Configure WebView settings for Android (called from native side)
 */
export const configureAndroidWebView = (): void => {
  if (!isAndroid()) {
    return;
  }

  console.log('Configuring Android WebView for Clerk compatibility');
  
  // Enable third-party cookies (required for Clerk)
  // This is typically done in native code, but we log it here for reference
  console.log('Third-party cookies should be enabled in MainActivity');
  
  // Enable DOM storage
  console.log('DOM storage should be enabled in MainActivity');
  
  // Enable JavaScript (should already be enabled by Capacitor)
  console.log('JavaScript should be enabled in MainActivity');
};

/**
 * Get redirect URIs for Clerk based on platform
 */
export const getClerkRedirectUris = (): string[] => {
  const platform = getPlatform();
  
  if (platform === 'android') {
    return [
      'com.receiptlocker.app://',
      'https://retreat-app.tech',
      'https://retreat-app.tech/',
    ];
  } else if (platform === 'ios') {
    return [
      'com.receiptlocker.app://',
      'https://retreat-app.tech',
      'https://retreat-app.tech/',
    ];
  } else {
    return [
      'https://retreat-app.tech',
      'https://retreat-app.tech/',
      window.location.origin,
    ];
  }
};

/**
 * Store auth token in platform-appropriate storage
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    // Use localStorage for all platforms (Capacitor handles this properly)
    localStorage.setItem('clerk_token', token);
    sessionStorage.setItem('clerk_token', token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
};

/**
 * Retrieve auth token from platform-appropriate storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try localStorage first
    const token = localStorage.getItem('clerk_token') || sessionStorage.getItem('clerk_token');
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Clear auth token from storage
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    localStorage.removeItem('clerk_token');
    sessionStorage.removeItem('clerk_token');
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};

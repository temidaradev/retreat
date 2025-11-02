// Mobile app configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.retreat-app.tech';

export const config = {
    api: {
        baseUrl: API_BASE_URL,
        timeout: 30000,
    },
    clerk: {
        publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    },
    app: {
        name: 'Retreat',
        version: '1.0.0',
    },
} as const;


// Environment configuration for the frontend
export const config = {
    // API Configuration
    api: {
        baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.temidara.rocks/api/v1' : 'http://localhost:8080/api/v1'),
        timeout: 10000, // 10 seconds
    },

    // Clerk Authentication
    clerk: {
        publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    },

    // Application Settings
    app: {
        name: 'Retreat',
        version: '1.0.0',
        environment: import.meta.env.MODE,
    },

    // External Services
    external: {
        buyMeACoffee: 'https://buymeacoffee.com/temidaradev',
    },

    // UI Configuration
    ui: {
        animationDuration: 200,
        debounceDelay: 300,
        paginationSize: 10,
    },

    // File Upload
    upload: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'text/plain'],
    },

    // Date Formats
    dateFormats: {
        display: 'MMMM dd, yyyy',
        api: 'yyyy-MM-dd',
        short: 'MMM dd, yyyy',
    },
} as const;

// Validation function for required environment variables
export const validateConfig = (): void => {
    if (!config.clerk.publishableKey) {
        throw new Error('Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.');
    }
};

// Export individual config sections for convenience
export const { api, clerk, app, external, ui, upload, dateFormats } = config;

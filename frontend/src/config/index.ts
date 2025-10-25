// Environment configuration for the frontend
export const config = {
    // API Configuration
    api: {
        baseUrl: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.retreat-app.tech' : 'http://localhost:8080'),
        timeout: 30000, // 30 seconds for production
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
    },

    // Clerk Authentication
    clerk: {
        publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
        // Billing configuration
        billing: {
            enabled: true,
            // Clerk billing costs 0.7% per transaction + Stripe fees
            transactionFee: 0.007,
        },
    },

    // Application Settings
    app: {
        name: 'Retreat',
        version: '1.0.0',
        environment: import.meta.env.MODE,
        productionUrl: 'https://retreat-app.tech',
        apiUrl: 'https://api.retreat-app.tech',
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

    // Feature Flags
    features: {
        enableAnalytics: import.meta.env.MODE === 'production',
        enableDebugMode: import.meta.env.MODE === 'development',
        enableSentry: import.meta.env.MODE === 'production',
    },
} as const;

// Validation function for required environment variables
export const validateConfig = (): void => {
    const errors: string[] = [];

    if (!config.clerk.publishableKey) {
        errors.push('Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.');
    }

    if (import.meta.env.MODE === 'production') {
        if (!config.api.baseUrl.startsWith('https://')) {
            errors.push('Production API URL must use HTTPS');
        }
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
};

// Export individual config sections for convenience
export const { api, clerk, app, external, ui, upload, dateFormats, features } = config;

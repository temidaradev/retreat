// Application Constants
export const APP_NAME = 'Retreat';
export const APP_VERSION = '1.0.0';

// Receipt Status
export const RECEIPT_STATUS = {
    ACTIVE: 'active',
    EXPIRING: 'expiring',
    EXPIRED: 'expired',
} as const;

// Buy Me a Coffee URL
export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/temidaradev';

// Date Formats
export const DATE_FORMATS = {
    DISPLAY: 'MMMM dd, yyyy',
    API: 'yyyy-MM-dd',
    SHORT: 'MMM dd, yyyy',
} as const;

// File Upload
export const FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'text/plain'],
} as const;

// UI Constants
export const UI = {
    ANIMATION_DURATION: 200,
    DEBOUNCE_DELAY: 300,
    PAGINATION_SIZE: 10,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Server error. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
    RECEIPT_CREATED: 'Receipt created successfully!',
    RECEIPT_UPDATED: 'Receipt updated successfully!',
    RECEIPT_DELETED: 'Receipt deleted successfully!',
} as const;

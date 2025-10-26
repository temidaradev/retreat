// Date utilities
export const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export const formatDateShort = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const getDaysUntilExpiry = (expiryDate: string | Date): number => {
    const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (expiryDate: string | Date, daysThreshold: number = 30): boolean => {
    return getDaysUntilExpiry(expiryDate) <= daysThreshold;
};

export const isExpired = (expiryDate: string | Date): boolean => {
    return getDaysUntilExpiry(expiryDate) < 0;
};

// Currency utilities
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    });
    return formatter.format(amount);
};

// Compact number formatting for large amounts
export const formatCompactNumber = (num: number): string => {
    if (num < 1000) {
        return num.toString();
    } else if (num < 1000000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    } else if (num < 1000000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
};

// Compact currency formatting for large amounts
export const formatCompactCurrency = (amount: number): string => {
    return '$' + formatCompactNumber(amount);
};

// String utilities
export const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
};

export const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const sanitizeString = (str: string): string => {
    return str.trim().replace(/\s+/g, ' ');
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};

// Array utilities
export const removeDuplicates = <T>(array: T[]): T[] => {
    return [...new Set(array)];
};

export const groupBy = <T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
): Record<K, T[]> => {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {} as Record<K, T[]>);
};

// Local storage utilities
export const storage = {
    get: <T>(key: string): T | null => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Silently fail if localStorage is not available
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Silently fail if localStorage is not available
        }
    },

    clear: (): void => {
        try {
            localStorage.clear();
        } catch {
            // Silently fail if localStorage is not available
        }
    },
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: number;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Error handling utilities
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
};

// URL utilities
import { api } from '../config'

export const buildApiUrl = (endpoint: string): string => {
    const baseUrl = api.baseUrl;
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

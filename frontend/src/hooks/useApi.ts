import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiService } from '../services/api';

// Generic hook for API calls with Clerk authentication
export const useApi = <T>(
    apiCall: (token?: string) => Promise<T>,
    dependencies: any[] = []
) => {
    const { getToken } = useAuth();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            console.log('useApi - Token retrieved:', {
                hasToken: !!token,
                tokenLength: token?.length || 0,
                tokenStart: token ? token.substring(0, 20) + '...' : 'none'
            });
            const result = await apiCall(token || undefined);
            setData(result);
        } catch (err) {
            console.error('useApi - Error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [getToken, ...dependencies]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
};

// Hook for receipts
export const useReceipts = () => {
    return useApi((token) => apiService.getReceipts(token));
};

// Hook for form submission with Clerk authentication
export const useFormSubmission = <T>(
    submitFn: (data: T, token?: string) => Promise<any>
) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submit = useCallback(async (data: T) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);
            const token = await getToken();
            await submitFn(data, token || undefined);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        } finally {
            setLoading(false);
        }
    }, [submitFn, getToken]);

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
    }, []);

    return { submit, loading, error, success, reset };
};

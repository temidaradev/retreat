import { useState, useEffect, useCallback } from 'react';
import type { DependencyList } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiService } from '../services/api';

// Generic hook for API calls with Clerk authentication
export const useApi = <T>(
    apiCall: () => Promise<T>,
    dependencies: DependencyList = []
) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getToken } = useAuth();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token from Clerk
            const token = await getToken();
            apiService.setAuthToken(token);

            const result = await apiCall();
            setData(result);
        } catch (err) {
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
    return useApi(() => apiService.getReceipts());
};

// Hook for form submission with Clerk authentication
export const useFormSubmission = <T, R = void>(
    submitFn: (data: T) => Promise<R>
) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const { getToken } = useAuth();

    const submit = useCallback(async (data: T) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            // Get auth token from Clerk
            const token = await getToken();
            apiService.setAuthToken(token);

            await submitFn(data);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        } finally {
            setLoading(false);
        }
    }, [getToken, submitFn]);

    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
    }, []);

    return { submit, loading, error, success, reset };
};

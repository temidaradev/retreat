// API service for React Native
import 'react-native-url-polyfill/auto';
import { config } from '../config';
import type {
    ReceiptData,
    CreateReceiptRequest,
    ParsedEmailData,
    ParsedPDFData,
    UserEmail,
    FeedbackRequest,
} from '../types';

const API_BASE_URL = config.api.baseUrl;

class ApiService {
    private authToken: string | null = null;

    setAuthToken(token: string | null) {
        this.authToken = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}/api/v1${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                let errorMessage = `API request failed: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    const text = await response.text();
                    if (text) errorMessage = text;
                }
                const error = new Error(errorMessage) as Error & { status?: number };
                error.status = response.status;
                throw error;
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error) {
                console.error('API request failed:', {
                    url,
                    error: error.message,
                    endpoint,
                });
            }
            throw error;
        }
    }

    // Receipt operations
    async getReceipts(): Promise<{ receipts: ReceiptData[] }> {
        return this.request<{ receipts: ReceiptData[] }>('/receipts');
    }

    async getReceipt(id: string): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`);
    }

    async createReceipt(data: CreateReceiptRequest): Promise<ReceiptData> {
        return this.request<ReceiptData>('/receipts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateReceipt(
        id: string,
        data: CreateReceiptRequest
    ): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteReceipt(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/receipts/${id}`, {
            method: 'DELETE',
        });
    }

    // Email parsing
    async parseEmail(
        emailContent: string
    ): Promise<{ parsed_data: ParsedEmailData }> {
        return this.request<{ parsed_data: ParsedEmailData }>('/parse-email', {
            method: 'POST',
            body: JSON.stringify({ email_content: emailContent }),
        });
    }

    // PDF parsing
    async parsePDF(pdfContent: string): Promise<{ parsed_data: ParsedPDFData }> {
        return this.request<{ parsed_data: ParsedPDFData }>('/parse-pdf', {
            method: 'POST',
            body: JSON.stringify({ pdf_content: pdfContent }),
        });
    }

    // Email management
    async getEmails(): Promise<{ emails: UserEmail[] }> {
        return this.request<{ emails: UserEmail[] }>('/emails');
    }

    async addEmail(email: string): Promise<{ message: string; email: UserEmail }> {
        return this.request<{ message: string; email: UserEmail }>('/emails', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async deleteEmail(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/emails/${emailId}`, {
            method: 'DELETE',
        });
    }

    async setPrimaryEmail(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/emails/${emailId}/set-primary`, {
            method: 'POST',
        });
    }

    async resendVerification(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(
            `/emails/${emailId}/resend-verification`,
            {
                method: 'POST',
            }
        );
    }

    // Feedback
    async sendFeedback(data: FeedbackRequest): Promise<{ message: string }> {
        return this.request<{ message: string }>('/feedback', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Health check
    async healthCheck(): Promise<{ status: string }> {
        return this.request<{ status: string }>('/health');
    }
}

export const apiService = new ApiService();


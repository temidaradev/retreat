// API service for connecting to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.retreat-app.tech/api/v1' : 'http://localhost:8080/api/v1')

export interface ReceiptData {
    id: string
    user_id: string
    store: string
    item: string
    purchase_date: string
    warranty_expiry: string
    amount: number
    currency: string
    status: 'active' | 'expiring' | 'expired'
    original_email?: string
    parsed_data?: string
    created_at: string
    updated_at: string
}

export interface CreateReceiptRequest {
    store: string
    item: string
    purchase_date: string
    warranty_expiry: string
    amount: number
    currency?: string
    original_email?: string
}

export interface ParsedEmailData {
    store: string
    item: string
    purchase_date: string
    warranty_expiry: string
    amount: number
    currency: string
    confidence: number
}

export interface ParsedPDFData {
    store: string
    item: string
    purchase_date: string
    warranty_expiry: string
    amount: number
    currency: string
    confidence: number
}



class ApiService {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        token?: string
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        }

        // Add Authorization header with Clerk JWT token if provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const response = await fetch(url, {
            headers,
            ...options,
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        return response.json()
    }

    // Receipt operations
    async getReceipts(token?: string): Promise<{ receipts: ReceiptData[] }> {
        return this.request<{ receipts: ReceiptData[] }>('/receipts', {}, token)
    }

    async getReceipt(id: string, token?: string): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`, {}, token)
    }

    async createReceipt(data: CreateReceiptRequest, token?: string): Promise<ReceiptData> {
        return this.request<ReceiptData>('/receipts', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    async updateReceipt(id: string, data: CreateReceiptRequest, token?: string): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, token)
    }

    async deleteReceipt(id: string, token?: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/receipts/${id}`, {
            method: 'DELETE',
        }, token)
    }

    // Email parsing
    async parseEmail(emailContent: string, token?: string): Promise<{ parsed_data: ParsedEmailData }> {
        return this.request<{ parsed_data: ParsedEmailData }>('/parse-email', {
            method: 'POST',
            body: JSON.stringify({ email_content: emailContent }),
        }, token)
    }

    // PDF parsing
    async parsePDF(pdfContent: string, token?: string): Promise<{ parsed_data: ParsedPDFData }> {
        return this.request<{ parsed_data: ParsedPDFData }>('/parse-pdf', {
            method: 'POST',
            body: JSON.stringify({ pdf_content: pdfContent }),
        }, token)
    }

    // Health check
    async healthCheck(token?: string): Promise<{ status: string }> {
        return this.request<{ status: string }>('/health', {}, token)
    }
}

export const apiService = new ApiService()

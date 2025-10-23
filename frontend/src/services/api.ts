// API service for connecting to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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

class ApiService {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}/api/v1${endpoint}`

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': 'demo-user', // TODO: Get from Clerk auth
                ...options.headers,
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        return response.json()
    }

    // Receipt operations
    async getReceipts(): Promise<{ receipts: ReceiptData[] }> {
        return this.request<{ receipts: ReceiptData[] }>('/receipts')
    }

    async getReceipt(id: string): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`)
    }

    async createReceipt(data: CreateReceiptRequest): Promise<ReceiptData> {
        return this.request<ReceiptData>('/receipts', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateReceipt(id: string, data: CreateReceiptRequest): Promise<ReceiptData> {
        return this.request<ReceiptData>(`/receipts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async deleteReceipt(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/receipts/${id}`, {
            method: 'DELETE',
        })
    }

    // Email parsing
    async parseEmail(emailContent: string): Promise<{ parsed_data: ParsedEmailData }> {
        return this.request<{ parsed_data: ParsedEmailData }>('/parse-email', {
            method: 'POST',
            body: JSON.stringify({ email_content: emailContent }),
        })
    }

    // Health check
    async healthCheck(): Promise<{ status: string }> {
        return this.request<{ status: string }>('/health')
    }
}

export const apiService = new ApiService()

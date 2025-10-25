// API service for connecting to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? 'https://api.retreat-app.tech' : 'http://localhost:8080')

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

export interface ApiError {
    error: string
    status: number
    request_id?: string
    timestamp?: string
}

class ApiService {
    private authToken: string | null = null

    /**
     * Set the authentication token from Clerk
     * This should be called after user authentication
     */
    setAuthToken(token: string | null) {
        this.authToken = token
    }

    /**
     * Make an authenticated API request
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}/api/v1${endpoint}`

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Add authentication token if available
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`
        }

        // Merge with provided headers
        if (options.headers) {
            Object.assign(headers, options.headers)
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include', // Include cookies for CORS
            })

            if (!response.ok) {
                // Try to parse error response
                let errorMessage = `API request failed: ${response.statusText}`
                try {
                    const errorData: ApiError = await response.json()
                    errorMessage = errorData.error || errorMessage
                } catch {
                    // If parsing fails, use status text
                }

                const error = new Error(errorMessage) as Error & { status?: number }
                error.status = response.status
                throw error
            }

            return response.json()
        } catch (error) {
            // Re-throw with additional context
            if (error instanceof Error) {
                console.error('API request failed:', {
                    url,
                    error: error.message,
                    endpoint,
                })
            }
            throw error
        }
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

    // PDF parsing
    async parsePDF(pdfContent: string): Promise<{ parsed_data: ParsedPDFData }> {
        return this.request<{ parsed_data: ParsedPDFData }>('/parse-pdf', {
            method: 'POST',
            body: JSON.stringify({ pdf_content: pdfContent }),
        })
    }



    // Health check
    async healthCheck(): Promise<{ status: string }> {
        return this.request<{ status: string }>('/health')
    }
}

export const apiService = new ApiService()

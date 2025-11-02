// API service for connecting to the backend
import { api as apiConfig } from '../config'

const API_BASE_URL = apiConfig.baseUrl

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

export interface SubscriptionData {
    is_premium: boolean
    plan: string
    receipt_limit: number
    receipt_count: number
    expires_at?: string
    status?: string
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
    message?: string
    user_id?: string
    email?: string
    config_help?: string
}

export interface UserEmail {
    id: string
    user_id: string
    email: string
    verified: boolean
    is_primary: boolean
    created_at: string
    updated_at: string
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
                let errorData: ApiError | null = null

                try {
                    errorData = await response.json() as ApiError
                    errorMessage = errorData.error || errorData.message || errorMessage
                } catch {
                    // If parsing fails, try to get text
                    try {
                        const text = await response.text()
                        if (text) {
                            errorMessage = text
                        }
                    } catch {
                        // If all parsing fails, use status text
                    }
                }

                const error = new Error(errorMessage) as Error & ApiError
                error.status = response.status

                // Preserve enhanced error fields from API response
                if (errorData) {
                    error.message = errorData.message || errorMessage
                    error.user_id = errorData.user_id
                    error.email = errorData.email
                    error.config_help = errorData.config_help
                    error.request_id = errorData.request_id
                    error.timestamp = errorData.timestamp
                }

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
    async getReceipts(): Promise<{ receipts: ReceiptData[], subscription?: SubscriptionData }> {
        return this.request<{ receipts: ReceiptData[], subscription?: SubscriptionData }>('/receipts')
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

    // Parse invoice link
    async parseInvoiceLink(link: string): Promise<{ receipt_id: string; message?: string }> {
        return this.request<{ receipt_id: string; message?: string }>(
            '/receipts/parse-link',
            {
                method: 'POST',
                body: JSON.stringify({ link }),
            }
        )
    }

    // Email management
    async getEmails(): Promise<{ emails: UserEmail[] }> {
        return this.request<{ emails: UserEmail[] }>('/emails')
    }

    async addEmail(email: string): Promise<{ message: string; email: UserEmail }> {
        return this.request<{ message: string; email: UserEmail }>('/emails', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })
    }

    async deleteEmail(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/emails/${emailId}`, {
            method: 'DELETE',
        })
    }

    async setPrimaryEmail(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/emails/${emailId}/set-primary`, {
            method: 'POST',
        })
    }

    async resendVerification(emailId: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/emails/${emailId}/resend-verification`, {
            method: 'POST',
        })
    }

    // Get current user's subscription status from backend
    // This checks the database subscription, not Clerk metadata
    async getUserSubscription(): Promise<{
        is_premium: boolean
        plan?: string
        status?: string
        expires_at?: string
        receipt_limit?: number
        receipt_count?: number
    }> {
        try {
            // First, try the /me endpoint which returns subscription data
            try {
                const userInfo = await this.request<{
                    user_id: string
                    email?: string
                    username?: string
                    subscription?: {
                        plan: string
                        status: string
                        is_premium: boolean
                        expires_at?: string
                    }
                }>('/me')

                // If subscription data is in /me response, use it
                if (userInfo.subscription) {
                    return {
                        is_premium: userInfo.subscription.is_premium,
                        plan: userInfo.subscription.plan,
                        status: userInfo.subscription.status,
                        expires_at: userInfo.subscription.expires_at
                    }
                }
            } catch (meError) {
                console.error('Error fetching /me endpoint:', meError)
            }

            // Fallback: Try to get subscription from receipts endpoint
            try {
                const receipts = await this.getReceipts()
                if (receipts.subscription) {
                    return {
                        is_premium: receipts.subscription.is_premium,
                        plan: receipts.subscription.plan,
                        status: receipts.subscription.status,
                        expires_at: receipts.subscription.expires_at,
                        receipt_limit: receipts.subscription.receipt_limit,
                        receipt_count: receipts.subscription.receipt_count
                    }
                }
            } catch (receiptsError) {
                console.error('Error fetching receipts for subscription data:', receiptsError)
            }

            // Final fallback: return free plan
            return { is_premium: false, plan: 'free', status: 'none', receipt_limit: 5, receipt_count: 0 }
        } catch (error) {
            console.error('Error checking subscription status:', error)
            // Default to free on any error
            return { is_premium: false, plan: 'free', status: 'none', receipt_limit: 5, receipt_count: 0 }
        }
    }

    // Health check
    async healthCheck(): Promise<{ status: string }> {
        return this.request<{ status: string }>('/health')
    }

    // Admin operations
    async getAdminDashboard(): Promise<{
        status: string
        data: {
            total_receipts: number
            active_subscriptions: number
            bmc_linked_users: number
            receipts_by_status: Record<string, number>
            timestamp: string
        }
    }> {
        return this.request('/admin/dashboard')
    }

    async getAdminSubscriptions(status?: string): Promise<{
        status: string
        count: number
        data: Array<{
            id: string
            user_id?: string
            clerk_user_id?: string
            plan: string
            status: string
            current_period_start?: string
            current_period_end?: string
            created_at: string
            updated_at: string
        }>
    }> {
        const endpoint = status ? `/admin/subscriptions?status=${status}` : '/admin/subscriptions'
        return this.request(endpoint)
    }

    async grantSubscription(clerkUserId: string, durationMonths: number = 1): Promise<{
        status: string
        message: string
        data: {
            subscription_id: string
            clerk_user_id: string
            duration_months: number
            expires_at: string
        }
    }> {
        return this.request('/admin/subscriptions/grant', {
            method: 'POST',
            body: JSON.stringify({
                clerk_user_id: clerkUserId,
                duration_months: durationMonths,
            }),
        })
    }

    async revokeSubscription(clerkUserId: string): Promise<{
        status: string
        message: string
        data: {
            subscription_id: string
            clerk_user_id: string
        }
    }> {
        return this.request('/admin/subscriptions/revoke', {
            method: 'POST',
            body: JSON.stringify({
                clerk_user_id: clerkUserId,
            }),
        })
    }

    async getBMCUsers(): Promise<{
        status: string
        count: number
        data: Array<{
            clerk_user_id: string
            bmc_username: string
            created_at: string
            updated_at: string
        }>
    }> {
        return this.request('/admin/bmc/users')
    }

    async linkBMCUsernameUser(bmcUsername: string): Promise<{
        message: string
        bmc_username: string
        note: string
    }> {
        return this.request('/bmc/link-username', {
            method: 'POST',
            body: JSON.stringify({
                bmc_username: bmcUsername,
            }),
        })
    }

    async linkBMCUsername(clerkUserId: string, bmcUsername: string): Promise<{
        status: string
        message: string
        data: {
            clerk_user_id: string
            bmc_username: string
        }
    }> {
        return this.request('/admin/bmc/link-username', {
            method: 'POST',
            body: JSON.stringify({
                clerk_user_id: clerkUserId,
                bmc_username: bmcUsername,
            }),
        })
    }

    async getSystemInfo(): Promise<{
        status: string
        data: {
            database: {
                status: string
                version?: string
                error?: string
            }
            config: {
                bmc_webhook_configured: boolean
                smtp_configured: boolean
                env: string
            }
            server: {
                port: string
                env: string
                dev_mode: boolean
            }
            timestamp: string
        }
    }> {
        return this.request('/admin/system-info')
    }

    // Feedback
    async sendFeedback(data: {
        name: string
        email: string
        subject: string
        message: string
    }): Promise<{ message: string }> {
        return this.request<{ message: string }>('/feedback', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }
}

export const apiService = new ApiService()

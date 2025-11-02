// Shared types for mobile app
export interface ReceiptData {
    id: string;
    user_id: string;
    store: string;
    item: string;
    purchase_date: string;
    warranty_expiry: string;
    amount: number;
    currency: string;
    status: 'active' | 'expiring' | 'expired';
    original_email?: string;
    parsed_data?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateReceiptRequest {
    store: string;
    item: string;
    purchase_date: string;
    warranty_expiry: string;
    amount: number;
    currency?: string;
    original_email?: string;
}

export interface ParsedEmailData {
    store: string;
    item: string;
    purchase_date: string;
    warranty_expiry: string;
    amount: number;
    currency: string;
    confidence: number;
}

export interface ParsedPDFData {
    store: string;
    item: string;
    purchase_date: string;
    warranty_expiry: string;
    amount: number;
    currency: string;
    confidence: number;
}

export interface ApiError {
    error: string;
    status: number;
    request_id?: string;
    timestamp?: string;
}

export interface UserEmail {
    id: string;
    user_id: string;
    email: string;
    verified: boolean;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

export interface FeedbackRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
}


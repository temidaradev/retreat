package models

// Re-export types from the types package for backward compatibility
// This allows existing code to continue using models.Receipt, etc.

import "receiptlocker/internal/types"

// Re-export all types
type Receipt = types.Receipt
type User = types.User
type Subscription = types.Subscription
type SponsorshipVerificationRequest = types.SponsorshipVerificationRequest
type ReceiptInfo = types.ReceiptInfo

// Re-export request/response types
type CreateReceiptRequest = types.CreateReceiptRequest
type ParseEmailRequest = types.ParseEmailRequest
type ParsedEmailData = types.ParsedEmailData
type ParsePDFRequest = types.ParsePDFRequest
type ParsedPDFData = types.ParsedPDFData
type CreateSubscriptionRequest = types.CreateSubscriptionRequest
type SponsorshipInfo = types.SponsorshipInfo
type SponsorshipStatus = types.SponsorshipStatus
type SponsorshipVerificationRequestPayload = types.SponsorshipVerificationRequestPayload

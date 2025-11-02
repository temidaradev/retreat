import { Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { UserEmail } from '../../services/api';
import VerificationStatus from './VerificationStatus';

interface EmailCardProps {
  email: UserEmail;
  onDelete: (emailId: string) => void;
  onSetPrimary: (emailId: string) => void;
  onResend: (emailId: string) => void;
}

export default function EmailCard({ email, onDelete, onSetPrimary, onResend }: EmailCardProps) {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleSetPrimary = async () => {
    if (!email.verified) {
      return;
    }
    setLoading(true);
    await onSetPrimary(email.id);
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await onResend(email.id);
    } finally {
      setResendLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(email.id);
    setLoading(false);
  };

  return (
    <div
      className="rounded-phi-lg border p-4 md:p-phi-lg transition-all duration-200"
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-phi flex-1 min-w-0">
            <Mail
              className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0"
              style={{ color: 'var(--color-text-tertiary)' }}
            />
            <span
              className="font-medium text-sm md:text-phi-base truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {email.email}
            </span>
          </div>
          <VerificationStatus verified={email.verified} isPrimary={email.is_primary} />
        </div>

        {!email.verified && (
          <div
            className="rounded-lg p-3 border"
            style={{
              background: 'var(--color-warning-bg)',
              borderColor: 'var(--color-warning)',
            }}
          >
            <p
              className="text-xs md:text-phi-sm mb-2"
              style={{ color: 'var(--color-warning)' }}
            >
              <strong>Email not verified.</strong> You must verify this email before you can forward receipts from it.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="px-3 py-1.5 rounded-phi-md text-xs md:text-phi-sm font-medium border transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              style={{
                background: 'var(--color-warning)',
                borderColor: 'var(--color-warning)',
                color: 'white',
              }}
            >
              <Mail className="w-3 h-3 md:w-4 md:h-4" />
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {!email.is_primary && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSetPrimary}
              disabled={loading || !email.verified}
              className="px-3 py-1.5 rounded-phi-md text-xs md:text-phi-sm font-medium border transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: email.verified ? 'var(--color-accent-500)' : 'var(--color-bg-tertiary)',
                borderColor: email.verified ? 'var(--color-accent-500)' : 'var(--color-border)',
                color: email.verified ? 'white' : 'var(--color-text-tertiary)',
              }}
              title={!email.verified ? 'Email must be verified before setting as primary' : 'Set this email as your primary email address'}
            >
              Set as Primary
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || resendLoading}
              className="px-3 py-1.5 rounded-phi-md text-xs md:text-phi-sm font-medium border transition-all duration-200 hover-lift disabled:opacity-50 flex items-center gap-1"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              Delete
            </button>
          </div>
        )}

        {email.is_primary && (
          <p
            className="text-xs md:text-phi-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            This is your primary email address for receiving notifications
          </p>
        )}
      </div>
    </div>
  );
}


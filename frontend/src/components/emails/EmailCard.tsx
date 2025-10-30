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

  const handleSetPrimary = async () => {
    setLoading(true);
    await onSetPrimary(email.id);
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    await onResend(email.id);
    setLoading(false);
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

        {!email.is_primary && (
          <div className="flex flex-wrap gap-2">
            {email.verified && (
              <button
                onClick={handleSetPrimary}
                disabled={loading}
                className="px-3 py-1.5 rounded-phi-md text-xs md:text-phi-sm font-medium border transition-all duration-200 hover-lift disabled:opacity-50"
                style={{
                  background: 'var(--color-accent-500)',
                  borderColor: 'var(--color-accent-500)',
                  color: 'white',
                }}
              >
                Set as Primary
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
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


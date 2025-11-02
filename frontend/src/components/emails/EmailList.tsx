import { Mail, AlertTriangle } from 'lucide-react';
import type { UserEmail } from '../../services/api';
import EmailCard from './EmailCard';

interface EmailListProps {
  emails: UserEmail[];
  onDelete: (emailId: string) => void;
  onSetPrimary: (emailId: string) => void;
  onResend: (emailId: string) => void;
}

export default function EmailList({ emails, onDelete, onSetPrimary, onResend }: EmailListProps) {
  const verifiedEmails = emails.filter(e => e.verified);
  const unverifiedEmails = emails.filter(e => !e.verified);
  const allUnverified = emails.length > 0 && verifiedEmails.length === 0;

  if (emails.length === 0) {
    return (
      <div
        className="rounded-phi-lg border p-8 md:p-phi-xl text-center"
        style={{
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Mail
          className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4"
          style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
        />
        <p
          className="text-base md:text-phi-md font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          No additional email addresses
        </p>
        <p
          className="text-sm md:text-phi-sm mt-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Add more email addresses to forward receipts from multiple accounts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-phi-lg">
      {allUnverified && (
        <div
          className="rounded-phi-lg border p-4 md:p-phi-lg"
          style={{
            background: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5"
              style={{ color: 'var(--color-warning)' }}
            />
            <div className="flex-1">
              <p
                className="text-sm md:text-phi-base font-medium mb-1"
                style={{ color: 'var(--color-warning)' }}
              >
                Verify your emails to start forwarding receipts
              </p>
              <p
                className="text-xs md:text-phi-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                You have {unverifiedEmails.length} unverified email{unverifiedEmails.length !== 1 ? 's' : ''}. 
                Please verify them to enable receipt forwarding.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:gap-phi lg:grid-cols-2">
        {emails.map((email) => (
          <EmailCard
            key={email.id}
            email={email}
            onDelete={onDelete}
            onSetPrimary={onSetPrimary}
            onResend={onResend}
          />
        ))}
      </div>
    </div>
  );
}


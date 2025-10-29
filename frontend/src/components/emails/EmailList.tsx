import { Mail } from 'lucide-react';
import type { UserEmail } from '../../services/api';
import EmailCard from './EmailCard';

interface EmailListProps {
  emails: UserEmail[];
  onDelete: (emailId: string) => void;
  onSetPrimary: (emailId: string) => void;
  onResend: (emailId: string) => void;
}

export default function EmailList({ emails, onDelete, onSetPrimary, onResend }: EmailListProps) {
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
  );
}


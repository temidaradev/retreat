import { Mail } from 'lucide-react';

interface ReceiptSourceBadgeProps {
  source?: string;
}

export default function ReceiptSourceBadge({ source }: ReceiptSourceBadgeProps) {
  if (!source || source !== 'email_body') return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        background: 'rgba(59, 130, 246, 0.2)',
        color: 'var(--color-accent-400)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
      }}
    >
      <Mail className="w-3 h-3" />
      <span className="hidden sm:inline">Created from email</span>
      <span className="sm:hidden">Email</span>
    </span>
  );
}


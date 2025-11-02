import { Check, Star, AlertTriangle } from 'lucide-react';

interface VerificationStatusProps {
  verified: boolean;
  isPrimary: boolean;
}

export default function VerificationStatus({ verified, isPrimary }: VerificationStatusProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {verified ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            border: '1px solid var(--color-success)',
          }}
          title="This email is verified and can forward receipts"
        >
          <Check className="w-3 h-3" />
          Verified
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            border: '1px solid var(--color-warning)',
          }}
          title="This email is not verified. Please verify it to forward receipts."
        >
          <AlertTriangle className="w-3 h-3" />
          Not Verified
        </span>
      )}
      
      {isPrimary && (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#6366f1',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Star className="w-3 h-3" />
          Primary
        </span>
      )}
    </div>
  );
}


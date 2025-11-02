import { Mail, Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface EmailForwardingCardProps {
  onShowHelp?: () => void;
}

export default function EmailForwardingCard({ onShowHelp }: EmailForwardingCardProps) {
  const [copied, setCopied] = useState(false);
  const forwardingEmail = 'save@retreat-app.tech';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(forwardingEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-phi-lg p-4 md:p-phi-lg border-2 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))',
        borderColor: 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="flex flex-col md:flex-row items-start gap-4">
        <div
          className="rounded-lg p-3 flex-shrink-0"
          style={{ background: 'var(--color-accent-500)' }}
        >
          <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-base md:text-phi-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              📧 Save Receipts by Email
            </h3>
            {onShowHelp && (
              <button
                onClick={onShowHelp}
                className="p-1 rounded hover-lift transition-all duration-200"
                style={{
                  color: 'var(--color-accent-400)',
                }}
                title="How it works"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
          <p
            className="text-xs md:text-phi-sm mb-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Forward your receipt emails to automatically extract and save them. 
            We'll parse the details and send you a confirmation.
          </p>

          <div
            className="rounded-lg p-3 md:p-4 border mb-4"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <label
              className="text-xs md:text-phi-sm mb-2 block"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Forward your receipts to:
            </label>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-3 md:px-4 py-2 rounded font-mono text-xs md:text-phi-sm overflow-x-auto"
                style={{
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-accent-400)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {forwardingEmail}
              </code>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded transition-all duration-200 hover-lift flex-shrink-0"
                style={{
                  background: copied ? 'var(--color-success-bg)' : 'var(--color-bg-tertiary)',
                  borderColor: copied ? 'var(--color-success)' : 'var(--color-border)',
                }}
                title="Copy email address"
              >
                {copied ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--color-success)' }} />
                ) : (
                  <Copy className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div
              className="rounded-lg p-3 border"
              style={{
                background: 'var(--color-info-bg)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <p
                className="text-xs md:text-phi-sm mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <strong>Important:</strong> Forward emails from <strong style={{ color: 'var(--color-accent-400)' }}>verified email addresses</strong>
              </p>
              <p
                className="text-xs md:text-phi-sm mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Only emails forwarded from verified addresses will be processed. 
                Make sure to{' '}
                <Link
                  to="/emails"
                  className="underline hover:no-underline font-medium"
                  style={{ color: 'var(--color-accent-400)' }}
                >
                  verify your email addresses
                </Link>
                {' '}first.
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                We'll automatically extract: store name, amount, date, and warranty info
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


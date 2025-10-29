import { Mail, Copy, Check, Info } from 'lucide-react';
import { useState } from 'react';

interface EmailInfoBannerProps {
  onLearnMore?: () => void;
}

export default function EmailInfoBanner({ onLearnMore }: EmailInfoBannerProps) {
  const [copied, setCopied] = useState(false);
  const forwardingEmail = 'save@retreat-app.tech';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(forwardingEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-phi-lg border p-4 md:p-phi-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))',
        borderColor: 'rgba(59, 130, 246, 0.3)',
      }}
    >
      <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
        <div
          className="rounded-lg p-3 flex-shrink-0"
          style={{ background: 'var(--color-accent-500)' }}
        >
          <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-base md:text-phi-lg font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              📧 How Email Forwarding Works
            </h3>
            {onLearnMore && (
              <button
                onClick={onLearnMore}
                className="p-1 rounded hover-lift transition-all duration-200"
                style={{ color: 'var(--color-accent-400)' }}
                title="Learn more"
              >
                <Info className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>

          <p
            className="text-xs md:text-phi-sm mb-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Forward receipt emails from any of your verified addresses to automatically save them
          </p>

          <div
            className="rounded-lg p-3 border"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-3 py-2 rounded font-mono text-xs md:text-phi-sm overflow-x-auto"
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
        </div>
      </div>
    </div>
  );
}


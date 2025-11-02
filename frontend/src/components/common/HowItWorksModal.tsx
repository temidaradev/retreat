import { Mail, Zap, Bell, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="rounded-phi-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '2px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-phi-lg">
          <div className="flex justify-between items-center mb-4 md:mb-phi-lg">
            <h2
              className="text-xl md:text-phi-xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              How Email Forwarding Works
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded hover-lift transition-all duration-200"
              style={{
                color: 'var(--color-text-tertiary)',
                background: 'var(--color-bg-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="space-y-4 md:space-y-phi-lg">
            {/* Step 1 */}
            <div className="flex gap-3 md:gap-4">
              <div
                className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59, 130, 246, 0.2)' }}
              >
                <Mail className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm md:text-phi-base mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  1. Forward Your Receipt Email
                </h3>
                <p
                  className="text-xs md:text-phi-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  When you receive a receipt email (from Amazon, stores, etc.), 
                  simply forward it to{' '}
                  <code
                    className="px-2 py-1 rounded font-mono text-xs"
                    style={{
                      background: 'var(--color-bg-primary)',
                      color: 'var(--color-accent-400)',
                    }}
                  >
                    save@retreat-app.tech
                  </code>
                  {' '}from your <strong>verified email address</strong>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 md:gap-4">
              <div
                className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(168, 85, 247, 0.2)' }}
              >
                <Zap className="w-5 h-5 md:w-6 md:h-6" style={{ color: '#a855f7' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm md:text-phi-base mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  2. We Parse the Details
                </h3>
                <p
                  className="text-xs md:text-phi-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Our system automatically extracts key information like store name, 
                  purchase amount, date, and warranty details from your email.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 md:gap-4">
              <div
                className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-success-bg)' }}
              >
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm md:text-phi-base mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  3. Receipt Created Automatically
                </h3>
                <p
                  className="text-xs md:text-phi-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  A new receipt is created in your account with all the extracted information. 
                  You can edit it anytime if needed.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-3 md:gap-4">
              <div
                className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-warning-bg)' }}
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--color-warning)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm md:text-phi-base mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  4. Get Confirmation
                </h3>
                <p
                  className="text-xs md:text-phi-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  You'll receive a confirmation email showing what we extracted, 
                  with a link to view or edit the receipt.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div
            className="mt-4 md:mt-phi-lg rounded-lg p-3 md:p-4 border"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
          >
            <h4
              className="font-semibold text-sm md:text-phi-base mb-2"
              style={{ color: 'var(--color-warning)' }}
            >
              💡 Tips for Best Results
            </h4>
            <ul className="space-y-1 text-xs md:text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <li>• Forward the original receipt email from the merchant</li>
              <li>• <strong>Forward from a verified email address</strong> -{' '}
                <Link
                  to="/emails"
                  className="underline hover:no-underline"
                  style={{ color: 'var(--color-accent-400)' }}
                >
                  verify your emails here
                </Link>
              </li>
              <li>• Include the full email content (don't trim it)</li>
              <li>• Works best with order confirmations and invoices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


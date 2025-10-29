import { X, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EmailForwardingTip() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this tip before
    const isDismissed = localStorage.getItem('emailForwardingTipDismissed');
    setDismissed(isDismissed === 'true');
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('emailForwardingTipDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className="rounded-phi-lg p-4 mb-4 md:mb-phi-lg relative animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
        color: 'white',
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors duration-200 rounded p-1"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <X className="w-4 h-4 md:w-5 md:h-5" />
      </button>
      <div className="flex items-start gap-3 pr-10">
        <Mail className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold mb-1 text-sm md:text-phi-base">💡 Pro Tip: Save Receipts by Email</h3>
          <p className="text-xs md:text-phi-sm text-blue-50 mb-2">
            Forward your receipt emails to{' '}
            <code
              className="px-2 py-0.5 rounded font-mono"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              save@retreat-app.tech
            </code>{' '}
            and we'll automatically save them for you!
          </p>
          <button
            onClick={() => {
              const element = document.getElementById('email-forwarding-card');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs md:text-phi-sm underline hover:no-underline"
          >
            Learn more →
          </button>
        </div>
      </div>
    </div>
  );
}


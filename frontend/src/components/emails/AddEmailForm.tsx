import { Plus } from 'lucide-react';
import { useState } from 'react';

interface AddEmailFormProps {
  onAdd: (email: string) => Promise<void>;
}

export default function AddEmailForm({ onAdd }: AddEmailFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onAdd(email);
      setEmail('');
    } catch (err) {
      // Error handling done in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-phi-lg border p-4 md:p-phi-lg"
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h4
        className="text-base md:text-phi-md font-semibold mb-3 md:mb-phi flex items-center gap-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Plus className="w-5 h-5" />
        Add New Email Address
      </h4>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new-email@example.com"
            className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base transition-all duration-200"
            style={{
              background: 'var(--color-bg-primary)',
              borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            disabled={loading}
          />
          {error && (
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--color-danger)' }}
            >
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-4 md:px-phi py-2 md:py-phi-sm rounded-phi-md font-medium text-sm md:text-phi-base transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
            color: 'white',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          }}
        >
          {loading ? 'Adding...' : 'Add Email'}
        </button>
      </form>

      <p
        className="text-xs mt-3"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        A verification email will be sent to the new address
      </p>
    </div>
  );
}


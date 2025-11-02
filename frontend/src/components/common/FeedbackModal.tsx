import { X, Send } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { apiService } from '../../services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useUser();
  const [name, setName] = useState(user?.fullName || user?.firstName || '');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await apiService.sendFeedback({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      
      setSent(true);
      // Reset form after successful send
      setTimeout(() => {
        setName(user?.fullName || user?.firstName || '');
        setEmail(user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || '');
        setSubject('');
        setMessage('');
        setSent(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send feedback. Please try again.');
      console.error('Error sending feedback:', err);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setError(null);
      setSent(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        className="rounded-phi-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
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
              Send Feedback to Developer
            </h2>
            <button
              onClick={handleClose}
              disabled={sending}
              className="p-2 rounded hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color: 'var(--color-text-tertiary)',
                background: 'var(--color-bg-tertiary)',
              }}
              onMouseEnter={(e) => {
                if (!sending) {
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-success-bg)' }}
              >
                <Send className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Thank you!
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Your feedback has been sent successfully. We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-phi">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm md:text-phi-base font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={sending}
                  className="w-full px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md border focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm md:text-phi-base font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={sending}
                  className="w-full px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md border focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm md:text-phi-base font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={sending}
                  className="w-full px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md border focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Bug report, feature request, etc."
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm md:text-phi-base font-medium mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={sending}
                  rows={6}
                  className="w-full px-3 md:px-phi py-2 md:py-phi-sm rounded-phi-md border focus-ring transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Describe the issue, bug, or feature request in detail..."
                />
              </div>

              {error && (
                <div
                  className="p-3 rounded-phi-md border"
                  style={{
                    background: 'var(--color-danger-bg)',
                    borderColor: 'var(--color-danger)',
                    color: 'var(--color-danger)',
                  }}
                >
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 md:gap-phi justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={sending}
                  className="px-4 md:px-phi py-2 md:py-phi-sm rounded-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 md:px-phi py-2 md:py-phi-sm rounded-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api as apiConfig } from '../config';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/v1/verify-email/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect to email settings after 3 seconds with refresh flag
        setTimeout(() => {
          navigate('/emails', { state: { fromVerification: true } });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed. The link may have expired or is invalid.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again or request a new verification link.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div
        className="max-w-md w-full rounded-phi-lg border p-8 md:p-phi-xl text-center animate-scale-in"
        style={{
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        {status === 'loading' && (
          <>
            <div
              className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-6"
              style={{ borderColor: 'var(--color-accent-500)' }}
            ></div>
            <h1
              className="text-xl md:text-phi-xl font-bold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Verifying your email...
            </h1>
            <p
              className="text-phi-base"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Please wait while we verify your email address
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"
              style={{
                background: 'var(--color-success-bg)',
                border: '3px solid var(--color-success)',
              }}
            >
              <CheckCircle
                className="w-12 h-12"
                style={{ color: 'var(--color-success)' }}
              />
            </div>
            <h1
              className="text-xl md:text-phi-xl font-bold mb-2"
              style={{ color: 'var(--color-success)' }}
            >
              Email Verified! 🎉
            </h1>
            <p
              className="text-phi-base mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {message}
            </p>
            <p
              className="text-phi-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Redirecting to email settings...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'var(--color-danger-bg)',
                border: '3px solid var(--color-danger)',
              }}
            >
              <XCircle
                className="w-12 h-12"
                style={{ color: 'var(--color-danger)' }}
              />
            </div>
            <h1
              className="text-xl md:text-phi-xl font-bold mb-2"
              style={{ color: 'var(--color-danger)' }}
            >
              Verification Failed
            </h1>
            <p
              className="text-phi-base mb-6"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {message}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/emails')}
                className="px-6 py-3 rounded-phi-md font-medium transition-all duration-200 hover-lift"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                }}
              >
                <Mail className="w-5 h-5 inline mr-2" />
                Go to Email Settings
              </button>
              <p
                className="text-phi-sm"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                You can resend the verification email from there
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


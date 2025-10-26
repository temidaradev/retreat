import { AlertTriangle, XCircle } from 'lucide-react'
import type { CSSProperties } from 'react'

interface ErrorMessageProps {
  message: string
  title?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorMessage({ message, title = 'Error', onRetry, onDismiss }: ErrorMessageProps) {
  const containerStyle: CSSProperties = {
    background: 'var(--color-danger-bg)',
    borderColor: 'var(--color-danger)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div
      className="rounded-phi-lg p-phi-lg border flex items-start gap-phi"
      style={containerStyle}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
      <div className="flex-1">
        <h4 className="text-phi-base font-semibold mb-phi-sm" style={{ color: 'var(--color-danger)' }}>
          {title}
        </h4>
        <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        {(onRetry || onDismiss) && (
          <div className="flex gap-phi mt-phi">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all hover:opacity-80"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                }}
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all hover:opacity-80"
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid',
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 transition-all hover:opacity-80"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

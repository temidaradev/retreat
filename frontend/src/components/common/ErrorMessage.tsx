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
      className="rounded-phi-lg p-4 md:p-phi-lg border flex items-start gap-2 md:gap-phi"
      style={containerStyle}
    >
      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 md:mt-0" style={{ color: 'var(--color-danger)' }} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm md:text-phi-base font-semibold mb-2 md:mb-phi-sm" style={{ color: 'var(--color-danger)' }}>
          {title}
        </h4>
        <p className="text-xs md:text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        {(onRetry || onDismiss) && (
          <div className="flex flex-col sm:flex-row gap-2 md:gap-phi mt-3 md:mt-phi">
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

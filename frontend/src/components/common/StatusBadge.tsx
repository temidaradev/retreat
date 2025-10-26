import type { CSSProperties } from 'react'
import { Receipt, AlertTriangle } from 'lucide-react'

type Status = 'active' | 'expiring' | 'expired'

interface StatusBadgeProps {
  status: Status
  showIcon?: boolean
  className?: string
}

const getStatusConfig = (status: Status) => {
  switch (status) {
    case 'active':
      return {
        bg: 'var(--color-success-bg)',
        text: 'var(--color-success)',
        border: 'rgba(34, 197, 94, 0.3)',
        label: 'Active',
        icon: Receipt,
      }
    case 'expiring':
      return {
        bg: 'var(--color-warning-bg)',
        text: 'var(--color-warning)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Expiring Soon',
        icon: AlertTriangle,
      }
    case 'expired':
      return {
        bg: 'var(--color-danger-bg)',
        text: 'var(--color-danger)',
        border: 'rgba(239, 68, 68, 0.3)',
        label: 'Expired',
        icon: AlertTriangle,
      }
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.1)',
        text: 'var(--color-text-tertiary)',
        border: 'rgba(148, 163, 184, 0.3)',
        label: 'Unknown',
        icon: Receipt,
      }
  }
}

export default function StatusBadge({ status, showIcon = true, className = '' }: StatusBadgeProps) {
  const config = getStatusConfig(status)
  const Icon = config.icon

  const style: CSSProperties = {
    background: config.bg,
    color: config.text,
    borderColor: config.border,
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium border ${className}`}
      style={style}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      {config.label}
    </span>
  )
}

// Shared style constants for consistent styling across components
import type { CSSProperties } from 'react'

// Button Styles
export const PRIMARY_BUTTON_STYLE: CSSProperties = {
  background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
  color: 'white',
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
}

export const SECONDARY_BUTTON_STYLE: CSSProperties = {
  background: 'var(--color-bg-secondary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
}

export const DANGER_BUTTON_STYLE: CSSProperties = {
  background: 'var(--color-danger)',
  color: 'white',
}

// Modal Styles
export const MODAL_BACKDROP_STYLE: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.7)',
}

export const MODAL_CONTAINER_STYLE: CSSProperties = {
  background: 'var(--color-bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  maxWidth: '600px',
  width: '100%',
}

// Card Styles
export const CARD_STYLE: CSSProperties = {
  background: 'var(--color-bg-secondary)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: 'var(--space-lg)',
}

export const CARD_HOVER_STYLE: CSSProperties = {
  ...CARD_STYLE,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
}

// Input Styles
export const INPUT_STYLE: CSSProperties = {
  background: 'var(--color-bg-secondary)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-sm)',
}

// Status Badge Styles
export const STATUS_BADGE_STYLES = {
  active: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
  },
  expiring: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
  },
  expired: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
  },
} as const

// Icon Container Styles
export const ICON_CONTAINER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-full)',
  padding: 'var(--space-sm)',
}

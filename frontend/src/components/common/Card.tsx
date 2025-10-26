import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export default function Card({ children, className = '', hover = false, onClick, style }: CardProps) {
  const baseClasses = 'rounded-phi-lg p-phi-lg border'
  const hoverClasses = hover ? 'transition-all duration-200 hover-lift cursor-pointer' : ''
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`.trim()

  const defaultStyle: CSSProperties = {
    background: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border)',
    ...style,
  }

  return (
    <div className={combinedClasses} style={defaultStyle} onClick={onClick}>
      {children}
    </div>
  )
}

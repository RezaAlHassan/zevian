'use client'

import { colors, radius, animation, typography } from '@/design-system'
import { Icon, IconName } from '@/components/atoms/Icon'
import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', icon, loading, children, style, disabled, onMouseEnter, onMouseLeave, ...props }: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)
  const isActuallyDisabled = disabled || loading

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: radius.md,
    fontWeight: typography.weight.semibold,
    cursor: isActuallyDisabled ? 'not-allowed' : 'pointer',
    transition: `background ${animation.fast}, box-shadow ${animation.fast}, border-color ${animation.fast}, color ${animation.fast}`,
    border: 'none',
    fontFamily: typography.fonts.body,
  }

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '13px' },
    lg: { padding: '10px 20px', fontSize: '14px' },
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: hovered && !isActuallyDisabled ? colors.accentHover : colors.accent,
      color: '#fff',
      boxShadow: hovered && !isActuallyDisabled ? '0 0 24px rgba(91,127,255,0.4)' : '0 0 20px rgba(91,127,255,0.25)',
    },
    secondary: {
      background: hovered && !isActuallyDisabled ? colors.surface3 : colors.surface2,
      color: hovered && !isActuallyDisabled ? colors.text : colors.text2,
      border: `1px solid ${hovered && !isActuallyDisabled ? colors.borderHover : colors.border}`,
    },
    ghost: {
      background: hovered && !isActuallyDisabled ? colors.accentGlow : 'transparent',
      color: hovered && !isActuallyDisabled ? colors.accent : colors.text2,
    },
  }

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isActuallyDisabled ? { opacity: 0.45 } : {}),
        ...style,
      }}
      disabled={isActuallyDisabled}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e) }}
      {...props}
    >
      {loading ? (
        <div className="spinner" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} color="currentColor" />
      )}
      {children}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        button:focus-visible {
          outline: 2px solid ${colors.accent};
          outline-offset: 2px;
        }
      `}</style>
    </button>
  )
}
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

export function Button({ variant = 'primary', size = 'md', icon, loading, children, style, disabled, ...props }: ButtonProps) {
  const isActuallyDisabled = disabled || loading
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: radius.md,
    fontWeight: typography.weight.semibold,
    cursor: 'pointer',
    transition: `all ${animation.fast}`,
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
      background: colors.accent,
      color: '#fff',
      boxShadow: '0 0 20px rgba(91,127,255,0.25)',
    },
    secondary: {
      background: colors.surface2,
      color: colors.text2,
      border: `1px solid ${colors.border}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.text2,
    },
  }

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isActuallyDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
        ...style,
      }}
      disabled={isActuallyDisabled}
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
      `}</style>
    </button>
  )
}
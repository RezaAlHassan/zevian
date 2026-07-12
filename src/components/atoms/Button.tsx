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
      // Greyscale primary "Raised neutral" (P3): a dark raised surface + white label + hairline
      // border that lifts on hover. Primary by weight and border, not by a bright fill — so it reads
      // as the affirmative action without shouting over score data.
      background: hovered && !isActuallyDisabled ? '#262c3a' : colors.surface3,
      color: colors.text,
      border: `1px solid ${hovered && !isActuallyDisabled ? 'rgba(255,255,255,0.22)' : colors.borderHover}`,
      boxShadow: 'none',
    },
    secondary: {
      // Greyscale secondary "Ghost outline" (S2): transparent with a defined border; fills faintly
      // and brightens its text on hover. Lightest footprint that still reads as a button at rest.
      background: hovered && !isActuallyDisabled ? 'rgba(255,255,255,0.04)' : 'transparent',
      color: hovered && !isActuallyDisabled ? colors.text : colors.text2,
      border: `1px solid ${hovered && !isActuallyDisabled ? 'rgba(255,255,255,0.22)' : colors.borderHover}`,
    },
    ghost: {
      // Quietest tier: no border at rest, a faint tint + text→white on hover.
      background: hovered && !isActuallyDisabled ? colors.accentGlow : 'transparent',
      color: hovered && !isActuallyDisabled ? colors.text : colors.text2,
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
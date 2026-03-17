'use client'

import { colors, radius, animation, typography } from '@/design-system'
import { Icon, IconName, Chip } from '@/components/atoms'
import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: IconName
  action?: React.ReactNode
  chip?: React.ReactNode
  className?: string
  danger?: boolean
}

export function Card({ children, title, subtitle, icon, action, chip, danger }: CardProps) {
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {(title || action || chip) && (
        <div
          style={{
            padding: '18px 20px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {icon && (
            <Icon name={icon} size={15} color={danger ? colors.danger : colors.accent} />
          )}
          {title && (
            <div style={{ fontFamily: typography.fonts.display, fontWeight: typography.weight.semibold, fontSize: '14px', color: danger ? colors.danger : colors.text, flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {title}
              {chip}
            </div>
          )}
          {subtitle && (
            <span style={{ fontSize: '12px', color: colors.text3, marginLeft: '-8px' }}>
              {subtitle}
            </span>
          )}
          {action && (
            <div style={{ marginLeft: 'auto' }}>
              {action}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: title || icon ? '20px' : '0' }}>
        {children}
      </div>
    </div>
  )
}

interface SectionLabelProps {
  children: React.ReactNode
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div
      style={{
        fontFamily: typography.fonts.display,
        fontSize: '11px',
        fontWeight: typography.weight.semibold,
        color: colors.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {children}
      <span style={{ flex: 1, height: '1px', background: colors.border }} />
    </div>
  )
}
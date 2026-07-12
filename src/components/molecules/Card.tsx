'use client'

import { colors, radius, animation, typography } from '@/design-system'
import { Icon, IconName, Chip, Button } from '@/components/atoms'
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
  // Tightens header + body padding for list-style cards (dashboard / project panels) where the
  // child rows carry their own padding. Form-style cards keep the roomier default.
  dense?: boolean
}

export function Card({ children, title, subtitle, icon, action, chip, danger, className, dense }: CardProps) {
  // Body padding: dense list cards sit their rows close to the edge (rows pad themselves) with a
  // small top gap under the title; default cards keep the roomier 20px box.
  const bodyPadding = title || icon ? (dense ? '4px 8px 12px' : '20px') : '0'
  return (
    <div
      className={className}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.borderStrong}`,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {(title || action || chip) && (
        <div
          style={{
            padding: dense ? '14px 14px 4px' : '18px 20px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {icon && (
            <Icon name={icon} size={13} color={danger ? colors.danger : colors.text3} />
          )}
          {title && (
            <div style={{ fontFamily: typography.fonts.display, fontWeight: typography.weight.semibold, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: danger ? colors.danger : colors.text3, flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      <div style={{ padding: bodyPadding }}>
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

// Bottom "show all" action for list cards — the app-wide affordance for revealing a full list,
// replacing top-right "View all" links. Centered ghost button matching the dashboard Team panel.
export function ShowAllButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
      <Button variant="ghost" size="sm" onClick={onClick}>{label}</Button>
    </div>
  )
}

// Count badge for card headers ("29", "7") — a small, visible non-interactive pill so the count
// reads clearly against the muted title without looking like a clickable control.
export function CountLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '18px',
        padding: '0 6px',
        borderRadius: '999px',
        background: colors.surface3,
        border: `1px solid ${colors.border}`,
        fontSize: '11px',
        fontWeight: typography.weight.bold,
        color: colors.text2,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
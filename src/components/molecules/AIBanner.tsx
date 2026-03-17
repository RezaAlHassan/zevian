'use client'

import { colors, radius, animation, typography } from '@/design-system'
import { Button, Icon } from '@/components/atoms'
import React from 'react'

interface AIBannerProps {
  message: string
  highlightedText?: string
  onActionClick?: () => void
}

export function AIBanner({ message, highlightedText, onActionClick }: AIBannerProps) {
  const renderMessage = () => {
    if (!highlightedText) return message
    
    const parts = message.split(highlightedText)
    return (
      <>
        <strong style={{ color: colors.text }}>{highlightedText}</strong>
        {parts[1]}
      </>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 20px',
        background: `linear-gradient(90deg, rgba(91,127,255,0.08), rgba(0,212,170,0.05))`,
        border: '1px solid rgba(91,127,255,0.2)',
        borderRadius: radius.xl,
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: colors.accentGlow,
          border: '1px solid colors.accentBorder',
          borderRadius: radius.md,
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: typography.weight.semibold,
          color: colors.accent,
          whiteSpace: 'nowrap',
        }}
      >
        <Icon name="star" size={11} color={colors.accent} />
        Zevian AI
      </div>

      <div style={{ fontSize: '13px', color: colors.text2, flex: 1 }}>
        {renderMessage()}
      </div>

      <Button size="sm" onClick={onActionClick}>
        Generate Full Summary
      </Button>
    </div>
  )
}
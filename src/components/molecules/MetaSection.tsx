'use client'

import { colors, typography } from '@/design-system'
import { Icon, IconName } from '@/components/atoms/Icon'
import React from 'react'

interface MetaItem {
  icon: IconName
  text: string
}

interface MetaSectionProps {
  items: MetaItem[]
  fontSize?: string
  gap?: string
  itemGap?: string
  color?: string
}

export function MetaSection({ 
  items, 
  fontSize = '12px', 
  gap = '16px', 
  itemGap = '6px',
  color = colors.text3 
}: MetaSectionProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, flexWrap: 'wrap' }}>
      {items.map((item, i) => (
        <div 
          key={i} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: itemGap, 
            fontSize, 
            color,
            fontFamily: typography.fonts.body
          }}
        >
          <Icon name={item.icon} size={parseInt(fontSize) + 2} color={color} />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  )
}

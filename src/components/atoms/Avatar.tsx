'use client'

import { colors, radius, getAvatarGradient, getInitials, typography } from '@/design-system'
import React from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  style?: React.CSSProperties
}

const sizes = {
  sm:   { width: '24px', height: '24px', fontSize: '8px',  borderRadius: '6px' },
  md:   { width: '30px', height: '30px', fontSize: '10px', borderRadius: '7px' },
  lg:   { width: '32px', height: '32px', fontSize: '11px', borderRadius: '8px' },
  xl:   { width: '40px', height: '40px', fontSize: '14px', borderRadius: '10px' },
  '2xl':{ width: '52px', height: '52px', fontSize: '18px', borderRadius: '13px' },
}

export function Avatar({ name, size = 'md', style }: AvatarProps) {
  const sizeStyle = sizes[size]
  const gradient = getAvatarGradient(name)

  return (
    <div
      style={{
        ...sizeStyle,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: typography.weight.bold,
        color: '#fff',
        flexShrink: 0,
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
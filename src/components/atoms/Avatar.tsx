'use client'

import { getAvatarTones, getInitials, typography } from '@/design-system'
import React, { useState } from 'react'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Profile-picture URL. When present (and it loads) it replaces the monogram. */
  src?: string | null
  style?: React.CSSProperties
}

const sizes = {
  sm:   { width: '24px', height: '24px', fontSize: '9px',  borderRadius: '6px' },
  md:   { width: '30px', height: '30px', fontSize: '11px', borderRadius: '7px' },
  lg:   { width: '32px', height: '32px', fontSize: '12px', borderRadius: '8px' },
  xl:   { width: '40px', height: '40px', fontSize: '14px', borderRadius: '10px' },
  '2xl':{ width: '52px', height: '52px', fontSize: '18px', borderRadius: '13px' },
}

// Photo when available → tonal monogram fallback (getAvatarTones): curated solid fill + white
// initials, display font, hairline ring. If the image fails to load we fall back to the monogram so
// a broken photo never shows as a blank/broken-image box.
export function Avatar({ name, size = 'md', src, style }: AvatarProps) {
  const sizeStyle = sizes[size]
  const { bg, fg } = getAvatarTones(name)
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!src && !imgFailed

  return (
    <div
      style={{
        ...sizeStyle,
        background: bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: typography.fonts.display,
        fontWeight: typography.weight.semibold,
        letterSpacing: '-0.02em',
        color: fg,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        flexShrink: 0,
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}

'use client'

import { colors } from '@/design-system'
import React from 'react'

// Absence-state indicator for an entity (member / score) that has no score yet. This is a
// placeholder, not an error — rendered inline as a muted dot + label (no background, no border),
// matching the borderless dot-label pattern used across the dashboard lists.
//
//   reportCount === 0  → "No data yet"            (no report data at all)
//   reportCount  >  0  → "Collecting baseline · N reports"  (some reports, not enough to score)
export function NoDataPill({ reportCount = 0 }: { reportCount?: number }) {
  const collecting = reportCount > 0
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontWeight: 500,
      color: colors.text3,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors.text3, flexShrink: 0 }} />
      {collecting ? 'Collecting baseline' : 'No data yet'}
      {collecting && <span style={{ opacity: 0.8 }}>· {reportCount} report{reportCount === 1 ? '' : 's'}</span>}
    </span>
  )
}

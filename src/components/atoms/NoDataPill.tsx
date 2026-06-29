'use client'

import { colors } from '@/design-system'
import React from 'react'

// Absence-state pill for an entity (member / score) that has no score yet. This is a
// placeholder, not an error, so it uses the muted surface family — never an alert color — and
// is meant to sit where a status badge or score would normally appear.
//
//   reportCount === 0  → "No data yet"            (no report data at all)
//   reportCount  >  0  → "Collecting baseline · N reports"  (some reports, not enough to score)
//
// Design system rule: prefer this over faded grey text for "no score yet" states so the row
// stays readable at scanning speed.
export function NoDataPill({ reportCount = 0 }: { reportCount?: number }) {
  const collecting = reportCount > 0
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 9px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 600,
      color: colors.text3,
      background: colors.surface3,
      border: '1px solid rgba(255,255,255,0.06)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors.text3, flexShrink: 0 }} />
      {collecting ? 'Collecting baseline' : 'No data yet'}
      {collecting && <span style={{ opacity: 0.8 }}>· {reportCount} report{reportCount === 1 ? '' : 's'}</span>}
    </span>
  )
}

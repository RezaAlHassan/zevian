'use client'

import React, { useState } from 'react'
import { colors, radius, animation, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms'

interface AISummary {
  headline: string
  overall_rating: 'strong' | 'good' | 'average' | 'needs_improvement'
  highlights: string[]
  concerns: string[]
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  recommendation: string
}

interface AISummaryMeta {
  employeeName: string
  periodLabel: string
  reportCount: number
  generatedAt: string
}

interface Props {
  employeeId: string
  employeeName: string
  startDate?: string
  endDate?: string
}

const RATING_CONFIG = {
  strong:            { label: 'Strong',            color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  good:              { label: 'Good',              color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  average:           { label: 'Average',           color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  needs_improvement: { label: 'Needs Improvement', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const TREND_CONFIG = {
  improving:         { label: 'Improving',         icon: 'trendingUp'   as const, color: '#22c55e' },
  stable:            { label: 'Stable',            icon: 'minus'        as const, color: '#f59e0b' },
  declining:         { label: 'Declining',         icon: 'trendingDown' as const, color: '#ef4444' },
  insufficient_data: { label: 'Not enough data',   icon: 'help'         as const, color: colors.text3 },
}

export function AISummaryCard({ employeeId, employeeName, startDate, endDate }: Props) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [meta, setMeta] = useState<AISummaryMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    setSummary(null)
    setExpanded(true)
    try {
      const res = await fetch('/api/ai/summarize-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to generate summary')
      setSummary(data.summary)
      setMeta(data.meta)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const rating = summary ? RATING_CONFIG[summary.overall_rating] : null
  const trend  = summary ? TREND_CONFIG[summary.trend]           : null

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.xl,
      overflow: 'hidden',
      marginBottom: '4px',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        cursor: 'pointer',
      }} onClick={() => !loading && setExpanded(v => !v)}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(20,184,166,0.2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="sparkles" size={16} color={colors.accent} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>AI Performance Summary</div>
          <div style={{ fontSize: '11px', color: colors.text3, marginTop: '1px' }}>
            {meta
              ? `${meta.reportCount} report${meta.reportCount !== 1 ? 's' : ''} · ${meta.periodLabel}`
              : 'Generate an AI-powered summary for the selected period'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {rating && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: rating.color,
              background: rating.bg,
              borderRadius: '6px',
              padding: '3px 8px',
            }}>
              {rating.label}
            </span>
          )}
          {trend && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: trend.color,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Icon name={trend.icon} size={12} color={trend.color} />
              {trend.label}
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={e => { e.stopPropagation(); generate() }}
            disabled={loading}
          >
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate'}
          </Button>
          <Icon
            name={expanded ? 'chevronUp' : 'chevronDown'}
            size={14}
            color={colors.text3}
          />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '20px' }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: colors.text3,
              fontSize: '13px',
              padding: '8px 0',
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${colors.border}`,
                borderTopColor: colors.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Analyzing {employeeName}'s performance data…
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: radius.lg,
              color: '#ef4444',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {summary && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Headline */}
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
                padding: '12px 16px',
                background: colors.surface2 ?? colors.bg,
                borderRadius: radius.lg,
                borderLeft: `3px solid ${colors.accent}`,
              }}>
                {summary.headline}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Highlights */}
                {summary.highlights.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="checkCircle" size={12} color="#22c55e" />
                      Highlights
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {summary.highlights.map((h, i) => (
                        <li key={i} style={{
                          fontSize: '12.5px',
                          color: colors.text2,
                          padding: '8px 10px',
                          background: 'rgba(34,197,94,0.06)',
                          borderRadius: '8px',
                          lineHeight: '1.5',
                        }}>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {summary.concerns.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="alertTriangle" size={12} color="#f59e0b" />
                      Areas to Watch
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {summary.concerns.map((c, i) => (
                        <li key={i} style={{
                          fontSize: '12.5px',
                          color: colors.text2,
                          padding: '8px 10px',
                          background: 'rgba(245,158,11,0.06)',
                          borderRadius: '8px',
                          lineHeight: '1.5',
                        }}>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendation */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(99,102,241,0.06)',
                border: `1px solid rgba(99,102,241,0.15)`,
                borderRadius: radius.lg,
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.accent, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="lightbulb" size={12} color={colors.accent} />
                  Manager Recommendation
                </div>
                <p style={{ fontSize: '13px', color: colors.text2, margin: 0, lineHeight: '1.6' }}>
                  {summary.recommendation}
                </p>
              </div>
            </div>
          )}

          {!loading && !summary && !error && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
              Click <strong style={{ color: colors.text2 }}>Generate</strong> to create an AI-powered summary for the selected period.
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

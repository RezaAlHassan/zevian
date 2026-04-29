'use client'

import React, { useState, useEffect } from 'react'
import { colors, radius } from '@/design-system'
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
  organizationName: string
  periodLabel: string
  reportCount: number
  employeeCount: number
  orgAvgScore: string
  generatedAt: string
}

interface Persisted {
  summary: AISummary
  meta: AISummaryMeta
}

interface Props {
  organizationId: string
  organizationName?: string
  startDate?: string
  endDate?: string
  autoGenerate?: boolean
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export function AIOrganizationSummaryCard({ organizationId, organizationName, startDate, endDate, autoGenerate }: Props) {
  const [summary, setSummary] = useState<AISummary | null>(null)
  const [meta, setMeta] = useState<AISummaryMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sectionExpanded, setSectionExpanded] = useState(true)
  const [textExpanded, setTextExpanded] = useState(false)

  const storageKey = `ai-org-summary-${organizationId}`

  useEffect(() => {
    let hasCached = false
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed: Persisted = JSON.parse(raw)
        setSummary(parsed.summary)
        setMeta(parsed.meta)
        hasCached = true
      }
    } catch {}
    if (autoGenerate && !hasCached) {
      generate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  async function generate() {
    setLoading(true)
    setError(null)
    setSectionExpanded(true)
    try {
      const res = await fetch('/api/ai/summarize-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...(organizationName ? { organizationName } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to generate summary')
      setSummary(data.summary)
      setMeta(data.meta)
      setTextExpanded(false)
      try {
        localStorage.setItem(storageKey, JSON.stringify({ summary: data.summary, meta: data.meta }))
      } catch {}
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isGenerated = summary !== null

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.xl,
      overflow: 'hidden',
    }}>
      {/* Header row — always visible */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
      }}>
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

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>AI Organisation Summary</div>
          {isGenerated && meta ? (
            <div style={{ fontSize: '11px', color: colors.text3, marginTop: '1px' }}>
              Last generated: {fmtDate(meta.generatedAt)}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: colors.text3, marginTop: '1px' }}>
              Generate an AI-powered summary for the entire organisation.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isGenerated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={generate}
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Regenerate'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSectionExpanded(v => !v)}
              >
                {sectionExpanded ? 'Collapse ▴' : 'Expand ▾'}
              </Button>
            </>
          ) : (
            <Button variant="primary" size="sm" onClick={generate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate'}
            </Button>
          )}
        </div>
      </div>

      {/* Expandable content */}
      {(isGenerated && sectionExpanded) && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '20px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: colors.text3, fontSize: '13px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${colors.border}`,
                borderTopColor: colors.accent,
                borderRadius: '50%',
                animation: 'zv-spin 0.8s linear infinite',
                flexShrink: 0,
              }} />
              Analyzing organization performance data…
            </div>
          )}

          {error && !loading && (
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
              {/* Headline — collapsible after 3 lines */}
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
                padding: '12px 16px',
                background: colors.surface2,
                borderRadius: radius.lg,
                borderLeft: `3px solid ${colors.accent}`,
                display: '-webkit-box',
                WebkitLineClamp: textExpanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
                overflow: textExpanded ? 'visible' : 'hidden',
              } as React.CSSProperties}>
                {summary.headline}
              </p>

              {!textExpanded && (
                <button
                  onClick={() => setTextExpanded(true)}
                  style={{ background: 'none', border: 'none', color: colors.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0', textAlign: 'left', marginTop: '-10px' }}
                >
                  Show more ▾
                </button>
              )}

              {textExpanded && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {summary.highlights.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="checkCircle" size={12} color="#22c55e" />
                          Highlights
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {summary.highlights.map((h, i) => (
                            <li key={i} style={{ fontSize: '12.5px', color: colors.text2, padding: '8px 10px', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', lineHeight: '1.5' }}>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.concerns.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon name="alertTriangle" size={12} color="#f59e0b" />
                          Areas to Watch
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {summary.concerns.map((c, i) => (
                            <li key={i} style={{ fontSize: '12.5px', color: colors.text2, padding: '8px 10px', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', lineHeight: '1.5' }}>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.15)`, borderRadius: radius.lg }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.accent, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="lightbulb" size={12} color={colors.accent} />
                      Leadership Recommendation
                    </div>
                    <p style={{ fontSize: '13px', color: colors.text2, margin: 0, lineHeight: '1.6' }}>
                      {summary.recommendation}
                    </p>
                  </div>

                  <button
                    onClick={() => setTextExpanded(false)}
                    style={{ background: 'none', border: 'none', color: colors.text3, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '0', textAlign: 'left' }}
                  >
                    Show less ▴
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show loading spinner even if section is being generated for first time */}
      {!isGenerated && loading && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: colors.text3, fontSize: '13px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'zv-spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          Analyzing organization performance data…
        </div>
      )}

      {!isGenerated && error && !loading && (
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: '20px' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: radius.lg, color: '#ef4444', fontSize: '13px' }}>
            {error}
          </div>
        </div>
      )}

      <style>{`@keyframes zv-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

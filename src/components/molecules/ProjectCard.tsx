'use client'

import { colors, radius, animation, typography, getScoreColor, getAvatarGradient, getInitials, shadows } from '@/design-system'
import { StatusPill } from '@/components/atoms/StatusPill'
import { Icon } from '@/components/atoms/Icon'
import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProjectCardProps {
  id: string
  name: string
  category: string
  frequency: string
  status: any
  score: number | null
  reportCount: number
  goalCount: number
  lastReport: string
  emoji?: string
  members: { employee: { full_name: string; avatar_url?: string | null } }[]
  onComplete?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  onEdit?: (e: React.MouseEvent) => void
  readOnly?: boolean
  basePath?: string
}

export function ProjectCard({
  id,
  name,
  category,
  frequency,
  status,
  score,
  reportCount,
  goalCount,
  lastReport,
  members,
  onComplete,
  onDelete,
  onEdit,
  emoji,
  readOnly = false,
  basePath = '/projects'
}: ProjectCardProps) {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'org'
  const scoreColor = getScoreColor(score)

  return (
    <Link href={`${basePath}/${id}?${searchParams.toString()}`} style={{ textDecoration: 'none' }}>
      <div
        className="project-card"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.lg,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: `all ${animation.base}`,
          position: 'relative',
        }}
      >
        <div style={{ padding: '12px' }}>
          {!readOnly && (
              <div className="card-actions" style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px', opacity: 0, transition: `opacity ${animation.fast}`, zIndex: 2 }}>
                {onComplete && status !== 'completed' && (
                  <div
                    onClick={onComplete}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(16,185,129,0.1)',
                      color: colors.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Mark as Complete"
                  >
                    <Icon name="check" size={14} />
                  </div>
                )}
                {onEdit && (
                  <div
                    onClick={onEdit}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      color: colors.text2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Assign Managers"
                  >
                    <Icon name="users" size={14} />
                  </div>
                )}
                {onDelete && (
                  <div
                    onClick={onDelete}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'rgba(240,68,56,0.1)',
                      color: colors.danger,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Delete Project"
                  >
                    <Icon name="trash" size={14} />
                  </div>
                )}
              </div>
            )}

          <div style={{ fontFamily: typography.fonts.display, fontSize: '14px', fontWeight: typography.weight.bold, color: colors.text, letterSpacing: '-0.2px', marginBottom: '2px' }}>
            {name}
          </div>

          <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500, marginBottom: '10px' }}>
            {category} · {frequency}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <StatusPill status={status} score={score} />

            <div style={{ display: 'flex', marginLeft: '2px' }}>
              {members?.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.surface}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 700,
                    color: '#fff',
                    marginLeft: i === 0 ? 0 : '-6px',
                    background: getAvatarGradient(m.employee.full_name),
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {m.employee.avatar_url && <img src={m.employee.avatar_url} alt={m.employee.full_name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {getInitials(m.employee.full_name)}
                </div>
              ))}
              {(members?.length ?? 0) > 3 && (
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.surface}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 700,
                  color: colors.text3,
                  marginLeft: '-6px',
                  background: colors.surface3,
                }}>
                  +<span className="font-numeric" style={{ fontWeight: typography.weight.black }}>{(members?.length ?? 0) - 3}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            paddingTop: '10px',
            borderTop: `1px solid ${colors.border}`
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Avg Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-numeric" style={{
                  fontWeight: typography.weight.black,
                  fontSize: '14px',
                  color: scoreColor,
                }}>
                  {typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : '—'}
                </span>
              </div>
              {typeof score === 'number' && !isNaN(score) && (
                <div style={{ height: '4px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                  <div style={{ height: '100%', width: `${score * 10}%`, background: scoreColor, borderRadius: '2px' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reports
              </div>
              <div className="font-numeric" style={{ fontSize: '13px', color: colors.text, fontWeight: typography.weight.black }}>
                {reportCount} <span style={{ color: colors.text3, fontSize: '11px', fontWeight: typography.weight.medium, fontFamily: typography.fonts.display }}>total</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Goals
              </div>
              <div className="font-numeric" style={{ fontSize: '13px', color: colors.text2, fontWeight: typography.weight.black }}>
                {goalCount} <span style={{ color: colors.text3, fontSize: '11px', fontWeight: typography.weight.medium, fontFamily: typography.fonts.display }}>active</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '10px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last Report
              </div>
              <div style={{ fontFamily: typography.fonts.mono, fontSize: '12px', color: status === 'at-risk' ? colors.danger : colors.text2 }}>
                {lastReport}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .project-card:hover {
            border-color: ${colors.borderHover} !important;
            transform: translateY(-1px);
            box-shadow: ${shadows.cardHover};
          }
          .project-card:hover .card-actions {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    </Link>
  )
}
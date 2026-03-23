'use client'

import { colors, typography, radius, animation, getAvatarGradient, getInitials } from '@/design-system'
import { StatusPill } from '@/components/atoms/StatusPill'
import { Button } from '@/components/atoms/Button'
import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ProjectRowProps {
    id: string
    name: string
    description: string
    category: string
    frequency: string
    status: any
    score: number | null
    reportCount: number
    lastActivity: string
    members: { employee: { full_name: string } }[]
    onComplete?: (e: React.MouseEvent) => void
    onDelete?: (e: React.MouseEvent) => void
    onEdit?: (e: React.MouseEvent) => void
    readOnly?: boolean
    basePath?: string
}

export function ProjectRow({
    id,
    name,
    description,
    category,
    frequency,
    status,
    score,
    reportCount,
    lastActivity,
    members,
    onComplete,
    onDelete,
    onEdit,
    readOnly = false,
    basePath = '/projects'
}: ProjectRowProps) {
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'org'
    return (
        <Link
            href={`${basePath}/${id}?${searchParams.toString()}`}
            style={{ textDecoration: 'none', display: 'contents' }}
        >
            <tr
                style={{
                    cursor: 'pointer',
                    transition: `background ${animation.fast}`,
                }}
                className="project-table-row"
            >
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ fontWeight: typography.weight.semibold, fontSize: '13.5px', color: colors.text, marginBottom: '2px' }}>
                        {name}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: colors.text3,
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {description}
                    </div>
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{
                        display: 'inline-flex',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: colors.surface3,
                        color: colors.text2
                    }}>
                        {category}
                    </span>
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <StatusPill status={status} score={score} />
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex' }}>
                        {members.slice(0, 3).map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    border: `2px solid ${colors.surface}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '8px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    marginLeft: i === 0 ? 0 : '-6px',
                                    background: getAvatarGradient(m.employee.full_name),
                                }}
                            >
                                {getInitials(m.employee.full_name)}
                            </div>
                        ))}
                        {members.length > 3 && (
                            <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '6px',
                                border: `2px solid ${colors.surface}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 700,
                                color: colors.text3,
                                marginLeft: '-6px',
                                background: colors.surface3,
                            }}>
                                +<span className="font-numeric" style={{ fontWeight: 700 }}>{members.length - 3}</span>
                            </div>
                        )}
                        {members.length === 0 && (
                            <span style={{ fontSize: '12px', color: colors.text3 }}>Unassigned</span>
                        )}
                    </div>
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    {typeof score === 'number' && !isNaN(score) ? (
                        <span className="font-numeric" style={{
                            fontWeight: typography.weight.black,
                            fontSize: '16px',
                            color: score >= 7.5 ? colors.green : score >= 6.0 ? colors.warn : colors.danger,
                        }}>
                            {score.toFixed(1)}
                        </span>
                    ) : (
                        <span style={{ color: colors.text3 }}>—</span>
                    )}
                </td>
                <td style={{
                    padding: '14px',
                    borderBottom: `1px solid ${colors.border}`,
                    color: colors.text2,
                    fontFamily: typography.fonts.mono,
                    fontSize: '12.5px'
                }}>
                    <span style={{ fontFamily: typography.fonts.numeric, fontWeight: typography.weight.black }}>{reportCount}</span>
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{
                        display: 'inline-flex',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: colors.surface3,
                        color: colors.text2
                    }}>
                        {frequency}
                    </span>
                </td>
                <td style={{
                    padding: '14px',
                    borderBottom: `1px solid ${colors.border}`,
                    fontSize: '12.5px',
                    color: colors.text3
                }}>
                    {lastActivity}
                </td>
                <td style={{ padding: '14px', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {!readOnly ? (
                            <>
                                {onComplete && status !== 'completed' && (
                                    <Button variant="ghost" size="sm" icon="check" onClick={onComplete} style={{ color: colors.green }}>{null}</Button>
                                )}
                                {onEdit && (
                                    <Button variant="ghost" size="sm" icon="settings" onClick={onEdit} style={{ color: colors.accent }}>{null}</Button>
                                )}
                                {onDelete && (
                                    <Button variant="ghost" size="sm" icon="trash" onClick={onDelete} style={{ color: colors.danger }}>{null}</Button>
                                )}
                            </>
                        ) : null}
                        <Link href={`${basePath}/${id}?${searchParams.toString()}`} style={{ textDecoration: 'none' }}>
                            <Button variant="ghost" size="sm" icon="linkExternal">View</Button>
                        </Link>
                    </div>
                </td>
            </tr>
            <style jsx>{`
        .project-table-row:hover {
          background: ${colors.surface2};
        }
      `}</style>
        </Link>
    )
}

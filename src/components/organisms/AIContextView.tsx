'use client'

import { colors, radius, typography } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateProjectMemoryAction, refreshProjectMemoryAction } from '@/app/actions/projectActions'

interface Props {
    project: any
    readOnly?: boolean
}

export function AIContextView({ project, readOnly = false }: Props) {
    const router = useRouter()
    const [draft, setDraft] = useState(project.aiContext || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [updateMeta, setUpdateMeta] = useState<{ date: string; reportCount: number } | null>(null)

    // Parse the most recent [Auto-added ...] or [Auto-updated ...] tag for display
    const lastTagMatch = draft.match(/\[Auto-(?:added|updated) ([^\]]+)\][^\[]*$/)
    const lastTagDate = lastTagMatch ? lastTagMatch[1] : null

    const handleSave = async () => {
        setSaving(true)
        const res = await updateProjectMemoryAction(project.id, draft)
        if (res.success) {
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            router.refresh()
        } else {
            alert(res.error || 'Failed to save')
        }
        setSaving(false)
    }

    const handleUpdateMemory = async () => {
        setUpdating(true)
        const res = await refreshProjectMemoryAction(project.id)
        if (res.success) {
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            if (res.noNewFacts) {
                setUpdateMeta({ date: dateStr, reportCount: res.reportCount })
            } else {
                setDraft(res.memory ?? draft)
                setUpdateMeta({ date: dateStr, reportCount: res.reportCount })
            }
            router.refresh()
        } else {
            alert(res.error || 'Failed to update memory')
        }
        setUpdating(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: colors.bg }}>
            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, height: '56px',
                background: 'rgba(10,12,16,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: '10px', zIndex: 90,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text3 }}>
                    <Link href="/projects" style={{ color: colors.text2, textDecoration: 'none' }}>Projects</Link>
                    <span>/</span>
                    <Link href={`/projects/${project.id}`} style={{ color: colors.text2, textDecoration: 'none' }}>{project.name}</Link>
                    <span>/</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>Project Memory</span>
                </div>
            </header>

            <div style={{ maxWidth: '780px', margin: '0 auto', padding: '36px 28px 80px' }}>

                {/* Page heading */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontFamily: typography.fonts.display, fontSize: '24px', fontWeight: 800, color: colors.text, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                        Project Memory
                    </h1>
                    <p style={{ fontSize: '13.5px', color: colors.text3, lineHeight: 1.6 }}>
                        The AI reads this before scoring every report. Edit it manually or use Update Memory to pull patterns from recent reports.
                    </p>
                </div>

                {/* Memory card */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="sparkles" size={14} color={colors.accent} />
                            <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, fontFamily: typography.fonts.display }}>Memory</div>
                        </div>
                        {!readOnly && (
                            <Button variant="secondary" size="sm" icon="sparkles" onClick={handleUpdateMemory} disabled={updating}>
                                {updating ? 'Updating…' : 'Update Memory'}
                            </Button>
                        )}
                    </div>

                    <div style={{ padding: '20px 24px' }}>
                        {readOnly ? (
                            <>
                                <div style={{ fontSize: '13.5px', color: draft ? colors.text : colors.text3, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                    {draft || 'No memory set yet.'}
                                </div>
                                {lastTagDate && (
                                    <div style={{ marginTop: '12px', fontSize: '12px', color: colors.text3 }}>
                                        Last updated: {lastTagDate}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <textarea
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    placeholder="Notes, definitions, patterns, and context for this project. Use Update Memory to pull new facts from scored reports."
                                    rows={12}
                                    style={{
                                        width: '100%', background: colors.surface2, border: `1.5px solid ${colors.border}`,
                                        borderRadius: '10px', padding: '14px', fontSize: '13px', color: colors.text,
                                        fontFamily: typography.fonts.display, lineHeight: 1.6, resize: 'vertical', outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                    <div style={{ fontSize: '12px', color: colors.text3 }}>
                                        {updateMeta
                                            ? `Last updated: ${updateMeta.date} · Based on ${updateMeta.reportCount} report${updateMeta.reportCount !== 1 ? 's' : ''}`
                                            : lastTagDate
                                                ? `Last updated: ${lastTagDate}`
                                                : 'Not yet updated from reports'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {saved && <span style={{ fontSize: '12px', color: colors.green }}>Saved</span>}
                                        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || updating}>
                                            {saving ? 'Saving…' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

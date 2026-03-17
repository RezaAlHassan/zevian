'use client'

import { colors, radius, typography, animation, layout, zIndex, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    employees: any[]
    project?: any
    onSave?: (updatedProject: any) => void
}

export function AddProjectSheet({ isOpen, onClose, employees, project, onSave }: Props) {
    const [selectedCategory, setSelectedCategory] = useState(project?.category || 'Engineering')
    const [selectedFreq, setSelectedFreq] = useState(project?.frequency || 'Weekly')
    const [name, setName] = useState(project?.name || '')
    const [description, setDescription] = useState(project?.description || '')
    const [key, setKey] = useState(project?.key || (project?.id?.startsWith('mock-') ? project.id.toUpperCase() : ''))
    const [status, setStatus] = useState(project?.status || 'active')

    if (!isOpen) return null

    const categories = [
        { label: 'Engineering', emoji: '🖥️' },
        { label: 'Design', emoji: '🎨' },
        { label: 'Marketing', emoji: '📣' },
        { label: 'Product', emoji: '⚙️' },
        { label: 'Operations', emoji: '🔬' },
        { label: 'Other', emoji: '📊' },
    ]

    const frequencies = [
        { label: 'Daily', sub: 'Every working day' },
        { label: 'Weekly', sub: 'Once a week' },
        { label: 'Bi-weekly', sub: 'Every 2 weeks' },
        { label: 'Monthly', sub: 'Once a month' },
    ]

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: zIndex.modal,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
        }}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: layout.modalSheetWidthSm,
                    height: '100vh',
                    background: colors.surface,
                    borderLeft: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideIn 0.25s ease',
                }}
            >
                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: typography.fonts.display, fontSize: '17px', fontWeight: 700, color: colors.text, letterSpacing: '-0.3px' }}>
                            {project ? 'Edit Project' : 'Create New Project'}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px' }}>
                            {project ? 'Update project details and preferences.' : 'Projects collect goals and periodic status reports.'}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '7px',
                            background: colors.surface2,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: colors.text2,
                            transition: `all ${animation.fast}`,
                        }}
                    >
                        <Icon name="x" size={14} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Project Name & Key */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>
                                    Project Name <span style={{ color: colors.accent }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Q1 Product Launch"
                                    style={{
                                        padding: '10px 12px',
                                        background: colors.surface2,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: radius.md,
                                        fontSize: '14px',
                                        color: colors.text,
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Project Key</label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                                    placeholder="e.g. PROJ"
                                    readOnly={!!project}
                                    style={{
                                        padding: '10px 12px',
                                        background: project ? colors.bg : colors.surface2,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: radius.md,
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: project ? colors.text3 : colors.text,
                                        outline: 'none',
                                        textAlign: 'center'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe what this project covers..."
                                style={{
                                    padding: '10px 12px',
                                    background: colors.surface2,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.md,
                                    fontSize: '14px',
                                    color: colors.text,
                                    outline: 'none',
                                    resize: 'vertical',
                                    minHeight: '80px'
                                }}
                            />
                        </div>

                        {/* Category Picker */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Category</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {categories.map(cat => (
                                    <div
                                        key={cat.label}
                                        onClick={() => setSelectedCategory(cat.label)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '12px 8px',
                                            background: selectedCategory === cat.label ? colors.accentGlow : colors.surface2,
                                            border: `1.5px solid ${selectedCategory === cat.label ? colors.accentBorder : colors.border}`,
                                            borderRadius: radius.lg,
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                                        <span style={{ fontSize: '11.5px', fontWeight: 600, color: selectedCategory === cat.label ? colors.accent : colors.text2 }}>
                                            {cat.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '1px', background: colors.border, margin: '4px 0' }} />

                        {/* Reporting Frequency */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Reporting Frequency</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {frequencies.map(freq => (
                                    <div
                                        key={freq.label}
                                        onClick={() => setSelectedFreq(freq.label)}
                                        style={{
                                            padding: '10px 12px',
                                            background: selectedFreq === freq.label ? colors.accentGlow : colors.surface2,
                                            border: `1.5px solid ${selectedFreq === freq.label ? colors.accentBorder : colors.border}`,
                                            borderRadius: radius.md,
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`,
                                        }}
                                    >
                                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: selectedFreq === freq.label ? colors.accent : colors.text2 }}>
                                            {freq.label}
                                        </div>
                                        <div style={{ fontSize: '10px', color: selectedFreq === freq.label ? 'rgba(91,127,255,0.6)' : colors.text3, marginTop: '2px' }}>
                                            {freq.sub}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: '1px', background: colors.border, margin: '4px 0' }} />

                        {/* Project Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Project Status</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {[
                                    { id: 'active', label: 'Active', color: colors.accent },
                                    { id: 'at-risk', label: 'At Risk', color: colors.danger },
                                    { id: 'review', label: 'Review', color: colors.warn },
                                    { id: 'completed', label: 'Completed', color: colors.green },
                                ].map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => setStatus(s.id)}
                                        style={{
                                            padding: '10px 12px',
                                            background: status === s.id ? `${s.color}15` : colors.surface2,
                                            border: `1.5px solid ${status === s.id ? s.color : colors.border}`,
                                            borderRadius: radius.md,
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: status === s.id ? s.color : colors.text2 }}>
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        icon={project ? 'check' : 'plus'}
                        onClick={() => {
                            if (onSave) {
                                onSave({
                                    ...project,
                                    name,
                                    description,
                                    category: selectedCategory,
                                    frequency: selectedFreq,
                                    status,
                                    key
                                })
                            }
                            onClose()
                        }}
                    >
                        {project ? 'Save Changes' : 'Create Project'}
                    </Button>
                </div>
            </div>
            <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
        </div>
    )
}

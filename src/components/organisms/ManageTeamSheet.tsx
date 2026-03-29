'use client'

import { colors, radius, typography, animation, layout, zIndex, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState, useEffect } from 'react'

interface Member {
    employee: {
        id: string
        full_name: string
        role: string
    }
}

interface Props {
    isOpen: boolean
    onClose: () => void
    project: any
    employees: any[]
    isSaving?: boolean
    onSave?: (members: Member[]) => void
}

export function ManageTeamSheet({ isOpen, onClose, project, employees, isSaving = false, onSave }: Props) {
    const [members, setMembers] = useState<Member[]>(project.project_members || [])
    const [searchQuery, setSearchQuery] = useState('')

    // Reset state each time the modal opens, enriching member IDs against the employees prop
    // so the filter correctly excludes already-assigned people even if DB IDs differ
    useEffect(() => {
        if (isOpen) {
            const enriched = (project.project_members || []).map((m: any) => {
                const match = employees.find(e =>
                    String(e.id) === String(m.employee.id) ||
                    (e.full_name || e.name || '').toLowerCase() === (m.employee.full_name || '').toLowerCase()
                )
                return match
                    ? { employee: { ...m.employee, id: match.id, full_name: match.full_name || match.name || m.employee.full_name } }
                    : m
            })
            setMembers(enriched)
            setSearchQuery('')
        }
    }, [isOpen])

    if (!isOpen) return null

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index))
    }

    const addMember = (employee: any) => {
        if (members.some(m => m.employee.id === employee.id)) return
        setMembers([...members, { employee }])
    }

    const filteredEmployees = employees.filter(e =>
        (e.role === 'manager' || e.role === 'admin' || e.isAccountOwner) &&
        (e.full_name || e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
        !members.some(m =>
            String(m.employee.id) === String(e.id) ||
            (m.employee.full_name || '').toLowerCase() === (e.full_name || e.name || '').toLowerCase()
        )
    )

    const displayEmployees = filteredEmployees.slice(0, 6)

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
                            Assign Managers
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px' }}>
                            Assign managers to this project to oversee goals and review reports.
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Search + Inline results */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Add Manager</label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 12px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.md,
                            }}>
                                <Icon name="search" size={14} color={colors.text3} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search managers..."
                                    style={{
                                        flex: 1,
                                        background: 'none',
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '13.5px',
                                        color: colors.text,
                                        fontFamily: typography.fonts.body,
                                    }}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text3, display: 'flex', padding: 0 }}>
                                        <Icon name="x" size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Inline manager list — always visible, filtered by search */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {displayEmployees.length > 0 ? displayEmployees.map(emp => {
                                    const displayName = emp.full_name || emp.name || 'Unknown'
                                    return (
                                        <div
                                            key={emp.id}
                                            onClick={() => addMember({ ...emp, full_name: displayName })}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                background: colors.surface2,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: radius.md,
                                                cursor: 'pointer',
                                                transition: `background ${animation.fast}`,
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = colors.accentGlow)}
                                            onMouseLeave={e => (e.currentTarget.style.background = colors.surface2)}
                                        >
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '7px',
                                                background: getAvatarGradient(displayName),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0,
                                            }}>
                                                {getInitials(displayName)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{displayName}</div>
                                                {emp.title && <div style={{ fontSize: '11px', color: colors.text3 }}>{emp.title}</div>}
                                            </div>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon name="plus" size={11} color={colors.accent} />
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div style={{ padding: '16px 12px', fontSize: '13px', color: colors.text3, textAlign: 'center', background: colors.surface2, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                                        {searchQuery ? 'No managers match your search.' : 'All managers have been assigned.'}
                                    </div>
                                )}
                                {filteredEmployees.length > 6 && (
                                    <div style={{ fontSize: '11.5px', color: colors.text3, textAlign: 'center', padding: '6px 0' }}>
                                        +{filteredEmployees.length - 6} more — type to filter
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assigned Members */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>
                                Assigned Managers <span className="font-numeric" style={{ color: colors.text3, fontWeight: 500 }}>({members.length})</span>
                            </label>
                            {members.length === 0 ? (
                                <div style={{ padding: '20px', fontSize: '13px', color: colors.text3, textAlign: 'center', background: colors.surface2, borderRadius: radius.md, border: `1px dashed ${colors.border}` }}>
                                    No managers assigned yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {members.map((m, i) => (
                                        <div key={m.employee.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px 12px',
                                            background: colors.accentGlow,
                                            borderRadius: radius.lg,
                                            border: `1px solid ${colors.accentBorder}`,
                                        }}>
                                            <div style={{
                                                width: '30px', height: '30px', borderRadius: '7px',
                                                background: getAvatarGradient(m.employee.full_name),
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: '10px', color: '#fff',
                                            }}>
                                                {getInitials(m.employee.full_name)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{m.employee.full_name}</div>
                                                <div style={{ fontSize: '11px', color: colors.text3, textTransform: 'capitalize' }}>{m.employee.role || 'Manager'}</div>
                                            </div>
                                            <button
                                                onClick={() => removeMember(i)}
                                                style={{
                                                    width: '22px', height: '22px', borderRadius: '5px',
                                                    border: 'none', background: 'transparent',
                                                    color: colors.text3, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                <Icon name="x" size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
                    <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button
                        variant="primary"
                        disabled={isSaving}
                        onClick={() => { if (onSave) onSave(members) }}
                    >
                        {isSaving ? 'Saving…' : 'Save Changes'}
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

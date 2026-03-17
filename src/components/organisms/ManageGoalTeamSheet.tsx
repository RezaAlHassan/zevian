'use client'

import { colors, radius, typography, animation, layout, zIndex, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState } from 'react'

interface Member {
    employee: {
        id: string
        full_name: string
    }
}

interface Props {
    isOpen: boolean
    onClose: () => void
    goal: any
    employees: any[]
    onSave?: (members: Member[]) => void
}

export function ManageGoalTeamSheet({ isOpen, onClose, goal, employees, onSave }: Props) {
    const [members, setMembers] = useState<Member[]>(goal.goal_members || [])
    const [searchQuery, setSearchQuery] = useState('')

    if (!isOpen) return null

    const removeMember = (id: string) => {
        setMembers(members.filter(m => m.employee.id !== id))
    }

    const addMember = (employee: any) => {
        if (members.some(m => m.employee.id === employee.id)) return
        setMembers([...members, { employee }])
        setSearchQuery('')
    }

    const filteredEmployees = employees.filter(e =>
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !members.some(m => m.employee.id === e.id)
    )

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
                            Manage Goal Team
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px' }}>
                            Assign members to track and progress this goal.
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

                        {/* Add Member Search */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Add Member</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.text3 }}>
                                    <Icon name="search" size={14} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px 10px 36px',
                                        background: colors.surface2,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: radius.md,
                                        fontSize: '14px',
                                        color: colors.text,
                                        outline: 'none'
                                    }}
                                />
                                {searchQuery && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: colors.surface,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: radius.md,
                                        marginTop: '4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                        zIndex: 10,
                                        boxShadow: shadows.cardHover
                                    }}>
                                        {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                                            <div
                                                key={emp.id}
                                                onClick={() => addMember(emp)}
                                                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${colors.border}` }}
                                            >
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: getAvatarGradient(emp.full_name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 700 }}>
                                                    {getInitials(emp.full_name)}
                                                </div>
                                                <div style={{ fontSize: '13.5px', color: colors.text }}>{emp.full_name}</div>
                                                <div style={{ flex: 1 }} />
                                                <Icon name="plus" size={12} color={colors.accent} />
                                            </div>
                                        )) : (
                                            <div style={{ padding: '12px', fontSize: '13px', color: colors.text3, textAlign: 'center' }}>No results found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Members List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text }}>Assigned Members (<span className="font-numeric">{members.length}</span>)</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {members.map((m) => (
                                    <div key={m.employee.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: colors.surface2,
                                        borderRadius: radius.lg,
                                        border: `1px solid ${colors.border}`
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: getAvatarGradient(m.employee.full_name),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            color: '#fff'
                                        }}>
                                            {getInitials(m.employee.full_name)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text }}>{m.employee.full_name}</div>
                                        </div>
                                        <button
                                            onClick={() => removeMember(m.employee.id)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: colors.danger,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={() => {
                        if (onSave) onSave(members)
                        onClose()
                    }}>Save Changes</Button>
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

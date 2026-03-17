'use client'

import React, { useState, useEffect } from 'react'
import { colors, radius, typography, animation, shadows, layout } from '@/design-system'
import { Icon, IconName } from '@/components/atoms'
import { Portal } from '@/components/atoms/Portal'
import { Button } from '@/components/atoms/Button'
import { inviteEmployeesAction, getInviteModalDataAction } from '@/app/actions/inviteActions'
import { Project, Goal } from '@/types'

interface InviteModalProps {
    isOpen: boolean
    onClose: () => void
    orgName?: string
}

interface Manager {
    id: string
    name: string
    title: string
}

// We dynamically fetch projects and goals

export function InviteModal({ isOpen, onClose, orgName = 'Acme Inc' }: InviteModalProps) {
    const [step, setStep] = useState(1)
    const [emails, setEmails] = useState<string[]>([])
    const [emailInput, setEmailInput] = useState('')
    const [emailErr, setEmailErr] = useState('')
    const [role, setRole] = useState<'employee' | 'manager'>('employee')
    const [managerId, setManagerId] = useState('m1')
    const [projects, setProjects] = useState<string[]>([])
    const [goals, setGoals] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [managerList, setManagerList] = useState<Manager[]>([])
    const [projectList, setProjectList] = useState<Project[]>([])
    const [goalList, setGoalList] = useState<Goal[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // Reset when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1)
            setEmails([])
            setEmailInput('')
            setEmailErr('')
            setRole('employee')
            setManagerId('')
            setProjects([])
            setGoals([])
            setErrorMsg('')
            setSearchTerm('')
            setIsDropdownOpen(false)
            loadData()
        }
    }, [isOpen])

    const loadData = async () => {
        const res = await getInviteModalDataAction()
        
        if (res.success) {
            if (res.managers) {
                setManagerList(res.managers as Manager[])
                if (res.managers.length > 0) {
                    setManagerId(res.managers[0].id)
                }
            }
            if (res.goals) setGoalList(res.goals as any[])
            if (res.projects) setProjectList(res.projects as any[])
        } else {
            console.error("Failed to load invite data:", res.error)
        }
    }

    if (!isOpen) return null

    const handleAddEmail = (e?: React.KeyboardEvent | React.FocusEvent) => {
        if (e && 'key' in e && e.key !== 'Enter' && e.key !== 'Tab') return
        if (e) e.preventDefault()

        const val = emailInput.trim()

        // handle comma or space separated pasting
        if (val.includes(',') || val.includes(';') || val.includes(' ')) {
            const parts = val.split(/[,;\s]+/).filter(Boolean)
            let addedAny = false
            const newEmails = [...emails]
            parts.forEach(p => {
                if (p.includes('@') && !newEmails.includes(p)) {
                    newEmails.push(p)
                    addedAny = true
                }
            })
            if (addedAny) {
                setEmails(newEmails)
                setEmailInput('')
                setEmailErr('')
            } else if (parts.length > 0) {
                setEmailErr("Invalid email format.")
            }
            return
        }

        if (val) {
            if (!val.includes('@') || !val.includes('.')) {
                setEmailErr(`"${val}" doesn't look like a valid email.`)
                return
            }
            if (emails.includes(val)) {
                setEmailErr(`${val} is already in the list.`)
                return
            }
            setEmails([...emails, val])
            setEmailInput('')
            setEmailErr('')
        }
    }

    const removeEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email))
    }

    const toggleProject = (id: string) => {
        if (projects.includes(id)) setProjects(projects.filter(i => i !== id))
        else setProjects([...projects, id])
    }

    const toggleGoal = (id: string) => {
        if (goals.includes(id)) setGoals(goals.filter(i => i !== id))
        else setGoals([...goals, id])
    }

    const nextStep = () => {
        if (step === 1) {
            if (emails.length === 0 && emailInput.trim() === '') {
                setEmailErr('Please add at least one email address.')
                return
            }
            if (emails.length === 0 && emailInput.trim() !== '') {
                handleAddEmail()
                return // wait for next tick or user to hit enter, if we add it we could proceed but let's be safe
            }
        }
        setEmailErr('')
        setStep(step + 1)
    }

    const handleSend = async () => {
        if (emails.length === 0) return

        setIsSubmitting(true)
        setErrorMsg('')

        const assignments = role === 'manager' ? projects : goals

        const res = await inviteEmployeesAction({
            emails,
            role,
            managerId,
            assignments
        })

        setIsSubmitting(false)

        if (res.success) {
            setStep(4) // success step
        } else {
            setErrorMsg(res.error || 'Failed to send invitations.')
        }
    }

    const isManager = role === 'manager'

    return (
        <Portal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '580px', maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 48px)', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '18px', display: 'flex', flexDirection: 'column', boxShadow: shadows.cardHover }} className="fade-scale-in">

                    {/* Header */}
                    <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                {step < 4 && (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: colors.accentGlow, border: `1px solid ${colors.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon name="users" size={18} color={colors.accent} />
                                    </div>
                                )}
                            </div>
                            <div onClick={onClose} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.text2, transition: 'all 0.15s' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = colors.surface3; e.currentTarget.style.color = colors.text }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = colors.text2 }}>
                                <Icon name="x" size={12} color="currentColor" />
                            </div>
                        </div>
                        {step === 1 && <><div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>Invite Team Members</div><div style={{ fontSize: '13px', color: colors.text3, lineHeight: 1.5 }}>Send invitations to join {orgName} on Zevian. They'll set their password on first login.</div></>}
                        {step === 2 && <><div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>Assign Projects & Goals</div><div style={{ fontSize: '13px', color: colors.text3, lineHeight: 1.5 }}>Optionally add {emails.length > 1 ? `${emails.length} invitees` : 'the invitee'} to projects and goals right away.</div></>}
                        {step === 3 && <><div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>Review & Send</div><div style={{ fontSize: '13px', color: colors.text3, lineHeight: 1.5 }}>Confirm the details before sending.</div></>}
                        {step === 4 && <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '4px' }}>Invitations Sent</div>}
                    </div>

                    {/* Progress Track */}
                    {step < 4 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '0 28px 20px', flexShrink: 0, borderBottom: `1px solid ${colors.border}`, marginTop: '20px' }}>
                            {[1, 2, 3].map(i => (
                                <React.Fragment key={i}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: i === 3 ? 'none' : 1, cursor: 'default' }}>
                                        <div style={{
                                            width: '26px', height: '26px', borderRadius: '50%',
                                            background: step >= i ? colors.accent : colors.surface2,
                                            color: step >= i ? '#fff' : colors.text3,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800,
                                            flexShrink: 0, transition: 'all 0.28s',
                                            border: `2px solid ${step >= i ? colors.accent : colors.border}`,
                                            boxShadow: step === i ? `0 0 0 5px ${colors.accentHover}` : 'none'
                                        }}>
                                            {step > i ? '✓' : i}
                                        </div>
                                        <span style={{ fontSize: '11.5px', fontWeight: 700, transition: 'color 0.2s', whiteSpace: 'nowrap', color: step > i ? colors.green : (step === i ? colors.accent : colors.text3) }}>
                                            {i === 1 ? 'Details' : i === 2 ? 'Assign' : 'Review'}
                                        </span>
                                    </div>
                                    {
                                        i < 3 && (
                                            <div style={{ flex: 1, height: '2px', background: colors.border, margin: '0 10px', borderRadius: '1px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: step > i ? '100%' : '0%', background: colors.green, borderRadius: '1px', transition: 'width 0.4s ease' }} />
                                            </div>
                                        )
                                    }
                                </React.Fragment>
                            ))}
                        </div>
                    )
                    }

                    {/* Content Body */}
                    <div style={{ flex: 1, overflow: 'visible', padding: '24px 28px' }}>
                        {step === 1 && (
                            <div className="slide-in">
                                {/* Email Addresses */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ color: colors.accent }}>*</span> Email Address(es)
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px', background: colors.surface2, border: `1px solid ${emailErr ? colors.danger : colors.border}`, borderRadius: '9px', minHeight: '42px', alignItems: 'center', transition: 'border-color 0.15s' }}>
                                        {emails.map(email => (
                                            <div key={email} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 5px 3px 9px', background: colors.accentGlow, border: `1px solid ${colors.accentBorder}`, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: colors.accent }}>
                                                {email}
                                                <div onClick={() => removeEmail(email)} style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(91,127,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                                    <Icon name="x" size={8} />
                                                </div>
                                            </div>
                                        ))}
                                        <input
                                            value={emailInput}
                                            onChange={e => setEmailInput(e.target.value)}
                                            onKeyDown={handleAddEmail}
                                            onBlur={handleAddEmail}
                                            placeholder={emails.length === 0 ? "name@company.com" : ""}
                                            style={{ flex: 1, minWidth: '160px', background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: colors.text, padding: '2px 4px' }}
                                        />
                                    </div>
                                    {emailErr && <div style={{ fontSize: '11.5px', color: colors.danger, marginTop: '5px' }}>{emailErr}</div>}
                                </div>

                                <div style={{ height: '1px', background: colors.border, margin: '16px 0' }} />

                                {/* Role */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ color: colors.accent }}>*</span> Role
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div onClick={() => setRole('employee')} style={{
                                            padding: '16px', background: !isManager ? colors.accentGlow : colors.surface2,
                                            border: `1.5px solid ${!isManager ? colors.accentBorder : colors.border}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', position: 'relative'
                                        }}>
                                            <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: `2px solid ${!isManager ? colors.accent : colors.border}`, position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {!isManager && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: colors.accent }}></div>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon name="user" size={15} color={colors.accent} />
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '13.5px', fontWeight: 800, marginBottom: '5px', letterSpacing: '-0.2px', color: !isManager ? colors.accent : colors.text }}>Employee</div>
                                            <div style={{ fontSize: '12px', color: !isManager ? colors.text2 : colors.text3, lineHeight: 1.55 }}>Submits reports. Views own scores only.</div>
                                        </div>
                                        <div onClick={() => setRole('manager')} style={{
                                            padding: '16px', background: isManager ? 'rgba(249,115,22,0.1)' : colors.surface2,
                                            border: `1.5px solid ${isManager ? 'rgba(249,115,22,0.3)' : colors.border}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', position: 'relative'
                                        }}>
                                            <div style={{ width: '17px', height: '17px', borderRadius: '50%', border: `2px solid ${isManager ? '#f97316' : colors.border}`, position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isManager && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f97316' }}></div>}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Icon name="users" size={15} color={'#f97316'} />
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '13.5px', fontWeight: 800, marginBottom: '5px', letterSpacing: '-0.2px', color: isManager ? '#f97316' : colors.text }}>Manager</div>
                                            <div style={{ fontSize: '12px', color: isManager ? colors.text2 : colors.text3, lineHeight: 1.55 }}>Reviews team reports. Can score, override AI, and invite members.</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reports To */}
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Reports To <span style={{ fontWeight: 400, color: colors.text3, fontSize: '10.5px', textTransform: 'none', letterSpacing: 0 }}>optional</span>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={managerId}
                                            onChange={e => setManagerId(e.target.value)}
                                            style={{ width: '100%', padding: '10px 36px 10px 13px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px', fontSize: '13px', color: colors.text, outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="">No manager assigned</option>
                                            {managerList.map(m => (
                                                <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `5px solid ${colors.text3}`, pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="slide-in">
                                {/* Preview Strip */}
                                <div style={{ marginBottom: '20px' }}>
                                    {emails.length === 1 ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff', flexShrink: 0, background: 'linear-gradient(135deg, #5b7fff, #8b5cf6)' }}>
                                                {emails[0].slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', marginBottom: '2px' }}>{emails[0]}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: isManager ? '#f97316' : colors.accent }}>{isManager ? 'Manager' : 'Employee'}</span>
                                                    <span style={{ color: colors.text3 }}>·</span>
                                                    <span style={{ fontSize: '12px', color: colors.text2 }}>Reports to {managerList.find(m => m.id === managerId)?.name || 'No manager'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px 14px', background: colors.accentGlow, border: `1px solid ${colors.accentBorder}`, borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Icon name="users" size={16} color={colors.accent} />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.accent }}>{emails.length} invitations</div>
                                                <div style={{ fontSize: '12px', color: colors.text2 }}>Assignments will apply to all {emails.length} invitees equally.</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Assign List */}
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name={isManager ? "layoutGrid" : "target"} size={12} />
                                        {isManager ? 'Assign to Projects' : 'Search & Select Goals'}
                                    </div>

                                    {isManager ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {projectList.map((item: any) => {
                                                const on = projects.includes(item.id)
                                                return (
                                                    <div key={item.id} onClick={() => toggleProject(item.id)} style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 13px', background: on ? colors.accentGlow : colors.surface2, border: `1.5px solid ${on ? colors.accentBorder : colors.border}`, borderRadius: '9px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s'
                                                    }}>
                                                        <div style={{ width: '17px', height: '17px', borderRadius: '5px', border: `1.5px solid ${on ? colors.accent : colors.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? colors.accent : colors.surface3 }}>
                                                            {on && <Icon name="check" size={10} color="#fff" />}
                                                        </div>
                                                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                                            <Icon name={"layoutGrid"} size={15} color={colors.text2} />
                                                        </div>
                                                        <div style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: on ? colors.accent : colors.text }}>{item.name}</div>
                                                        <div style={{ fontSize: '11.5px', color: colors.text3 }}>{item.reportFrequency}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px', minHeight: '44px', background: colors.surface2, border: `1px solid ${isDropdownOpen ? colors.accent : colors.border}`, borderRadius: '9px', cursor: 'text' }} onClick={() => setIsDropdownOpen(true)}>
                                                {goals.map(id => {
                                                    const g = goalList.find(x => x.id === id)
                                                    if (!g) return null
                                                    return (
                                                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px 4px 10px', background: colors.accentGlow, border: `1px solid ${colors.accentBorder}`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: colors.accent }}>
                                                            {g.name}
                                                            <div onClick={(e) => { e.stopPropagation(); toggleGoal(id) }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.6 }}>
                                                                <Icon name="x" size={12} />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <input
                                                    type="text"
                                                    placeholder={goals.length === 0 ? "Search goals by name..." : ""}
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    style={{ flex: 1, minWidth: '120px', background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: colors.text }}
                                                />
                                            </div>

                                            {isDropdownOpen && (
                                                <>
                                                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsDropdownOpen(false)} />
                                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '9px', boxShadow: shadows.cardHover, maxHeight: '200px', overflowY: 'auto', zIndex: 11 }}>
                                                        {goalList.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                                            goalList.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(g => {
                                                                const on = goals.includes(g.id)
                                                                return (
                                                                    <div key={g.id} onClick={() => { toggleGoal(g.id); setSearchTerm(''); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', background: on ? colors.surface2 : 'transparent' }}>
                                                                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `1px solid ${on ? colors.accent : colors.border}`, background: on ? colors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            {on && <Icon name="check" size={10} color="#fff" />}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ fontSize: '13px', fontWeight: 500, color: colors.text }}>{g.name}</div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        ) : (
                                                            <div style={{ padding: '12px 14px', fontSize: '12px', color: colors.text3, textAlign: 'center' }}>No goals found</div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="slide-in">
                                {/* Hero / List */}
                                {emails.length === 1 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: `linear-gradient(135deg, ${colors.accentHover}, ${'rgba(0,212,170,0.14)'})`, border: `1px solid ${colors.accentBorder}`, borderRadius: '12px', marginBottom: '18px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#fff', flexShrink: 0, background: 'linear-gradient(135deg, #5b7fff, #8b5cf6)' }}>
                                            {emails[0].slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px', marginBottom: '2px' }}>{emails[0]}</div>
                                            <div style={{ fontSize: '12px', color: colors.text2 }}>Invitation will be sent to this address</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: '14px' }}>
                                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Icon name="users" size={11} color={colors.accent} />
                                            {emails.length} Recipients
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {emails.map(email => (
                                                <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0, background: 'linear-gradient(135deg, #5b7fff, #8b5cf6)' }}>
                                                        {email.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: '12.5px', fontWeight: 600, flex: 1 }}>{email}</div>
                                                    <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: isManager ? 'rgba(249,115,22,0.1)' : colors.accentGlow, color: isManager ? '#f97316' : colors.accent }}>
                                                        {isManager ? 'Manager' : 'Employee'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Details Table */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontSize: '12px', color: colors.text3, width: '120px', padding: '9px 12px 9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>Role</td>
                                            <td style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, padding: '9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>
                                                <span style={{ fontWeight: 700, color: isManager ? '#f97316' : colors.accent }}>{isManager ? 'Manager' : 'Employee'}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontSize: '12px', color: colors.text3, width: '120px', padding: '9px 12px 9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>Reports To</td>
                                            <td style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, padding: '9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>
                                                {managerList.find(m => m.id === managerId)?.name || 'No manager assigned'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontSize: '12px', color: colors.text3, width: '120px', padding: '9px 12px 9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>Projects</td>
                                            <td style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, padding: '9px 0', borderBottom: `1px solid ${colors.border}`, verticalAlign: 'top' }}>
                                                {projects.length ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                        {projects.map(id => (
                                                            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: colors.accentGlow, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}>
                                                                {projectList.find(p => p.id === id)?.name || 'Unknown Project'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span style={{ color: colors.text3, fontWeight: 400, fontStyle: 'italic' }}>None assigned</span>}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontSize: '12px', color: colors.text3, width: '120px', padding: '9px 12px 9px 0', verticalAlign: 'top' }}>Goals</td>
                                            <td style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, padding: '9px 0', verticalAlign: 'top' }}>
                                                {goals.length ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                        {goals.map(id => (
                                                            <span key={id} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: colors.tealGlow, color: colors.teal, border: `1px solid ${'rgba(0,212,170,0.22)'}` }}>
                                                                {goalList.find(g => g.id === id)?.name || 'Unknown Goal'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span style={{ color: colors.text3, fontWeight: 400, fontStyle: 'italic' }}>None assigned</span>}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {errorMsg && <div style={{ padding: '12px', marginBottom: '14px', background: colors.dangerGlow, border: `1px solid ${colors.danger}`, color: colors.danger, fontSize: '13px', borderRadius: '8px' }}>{errorMsg}</div>}

                                <div style={{ padding: '12px 14px', background: 'rgba(91,127,255,0.06)', border: `1px solid ${colors.accentBorder}`, borderRadius: '10px', fontSize: '12.5px', color: colors.text2, lineHeight: 1.65, display: 'flex', gap: '9px' }}>
                                    <Icon name="alert" size={14} color={colors.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div>Each invitee will receive a secure activation link. They won&apos;t appear on team dashboards until they accept and set a password. The link expires in <strong>7 days</strong>.</div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="slide-in" style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: colors.greenGlow, border: `2px solid ${colors.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 0 30px rgba(16,185,129,0.2)` }}>
                                    <Icon name="check" size={28} color={colors.green} />
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.4px', marginBottom: '6px' }}>{emails.length > 1 ? `${emails.length} Invitations Sent!` : 'Invitation Sent!'}</div>
                                <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.65, marginBottom: '22px' }}>
                                    {emails.length > 1 ? 'Each invitee will receive a secure activation link. The links expire in 7 days.' : <span>A secure activation link was sent to <strong>{emails[0]}</strong>. It expires in 7 days.</span>}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px', textAlign: 'left' }}>
                                    {emails.map(e => (
                                        <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: colors.greenGlow, border: `1px solid ${'rgba(16,185,129,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon name="check" size={10} color={colors.green} />
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{e}</span>
                                            <span style={{ fontSize: '11px', color: colors.text3, marginLeft: 'auto' }}>Sent ✓</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: typography.fonts.body, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text2 }}>Close</button>
                                    <button onClick={() => setStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: typography.fonts.body, border: 'none', background: colors.accent, color: '#fff', boxShadow: `0 0 16px rgba(91,127,255,0.22)` }}>
                                        <Icon name="plus" size={13} /> Invite Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step < 4 && (
                        <div style={{ padding: '16px 28px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(17,19,24,0.8)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '12px', color: colors.text3 }}>Step {step} of 3</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {step > 1 && (
                                    <button onClick={() => setStep(step - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: typography.fonts.body, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text2 }}>
                                        <Icon name="chevronDown" style={{ transform: 'rotate(90deg)' }} size={13} /> Back
                                    </button>
                                )}
                                {step < 3 ? (
                                    <button onClick={nextStep} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: typography.fonts.body, border: 'none', background: colors.accent, color: '#fff', boxShadow: `0 0 16px rgba(91,127,255,0.22)` }}>
                                        Continue <Icon name="chevronRight" size={13} />
                                    </button>
                                ) : (
                                    <button onClick={handleSend} disabled={isSubmitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.4 : 1, fontFamily: typography.fonts.body, border: 'none', background: colors.accent, color: '#fff', boxShadow: `0 0 16px rgba(91,127,255,0.22)` }}>
                                        {isSubmitting ? 'Sending...' : (
                                            <>
                                                <Icon name="mail" size={13} /> Send Invitation{emails.length > 1 ? 's' : ''}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>
                <style jsx>{`
                .fade-scale-in { animation: scaleIn 0.32s cubic-bezier(0.22, 0.68, 0, 1.12) both; opacity: 1; transform: translateY(0) scale(1); }
@keyframes scaleIn { from { opacity: 0; transform: translateY(28px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .slide -in { animation: slideIn 0.28s cubic- bezier(0.22, 0.68, 0, 1) both; }
@keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
`}</style>
            </div>
        </Portal>
    )
}

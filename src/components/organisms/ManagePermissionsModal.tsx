'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'

interface CustomPermissions {
    canViewOrganizationWide: boolean
    canManageSettings: boolean
    canSetGlobalFrequency: boolean
    canCreateProjects: boolean
    canCreateGoals: boolean
    canOverrideAIScores: boolean
    canInviteUsers: boolean
}

interface ManagePermissionsModalProps {
    isOpen: boolean
    onClose: () => void
    employeeName: string
    initialTemplate?: 'standard' | 'senior' | 'read-only' | 'custom'
    initialPermissions?: CustomPermissions
    onSave?: (template: string, permissions: CustomPermissions) => void
}

const defaultPermissions: CustomPermissions = {
    canViewOrganizationWide: false,
    canManageSettings: false,
    canSetGlobalFrequency: false,
    canCreateProjects: false,
    canCreateGoals: false,
    canOverrideAIScores: false,
    canInviteUsers: false
}

const standardPermissions: CustomPermissions = {
    ...defaultPermissions,
    canInviteUsers: true,
    canCreateProjects: true,
    canCreateGoals: true,
    canOverrideAIScores: true
}

const seniorPermissions: CustomPermissions = {
    ...standardPermissions,
    canViewOrganizationWide: true,
    canManageSettings: true,
    canSetGlobalFrequency: true
}

const readOnlyPermissions: CustomPermissions = {
    ...defaultPermissions,
    canViewOrganizationWide: true
}

const PERMISSION_CONFIG = [
    { key: 'canViewOrganizationWide', label: 'View Organization-Wide', desc: "See all employees' data, not just direct reports" },
    { key: 'canManageSettings', label: 'Manage Settings', desc: 'Modify org-level settings (reporting frequency, policies)' },
    { key: 'canSetGlobalFrequency', label: 'Set Global Frequency', desc: 'Override the global reporting schedule' },
    { key: 'canCreateProjects', label: 'Create Projects', desc: 'Create and manage organizational projects' },
    { key: 'canCreateGoals', label: 'Create Goals', desc: 'Create and assign goals to team members' },
    { key: 'canInviteUsers', label: 'Invite Users', desc: 'Invite new employees to the organization' },
    { key: 'canOverrideAIScores', label: 'Override AI Scores', desc: 'Can manually override AI evaluation scores (Logged for audit trail)', danger: true },
]

export function ManagePermissionsModal({ 
    isOpen, 
    onClose, 
    employeeName,
    initialTemplate = 'standard',
    initialPermissions = standardPermissions,
    onSave 
}: ManagePermissionsModalProps) {
    const [template, setTemplate] = useState<'standard' | 'senior' | 'read-only' | 'custom'>(initialTemplate)
    const [customPerms, setCustomPerms] = useState<CustomPermissions>(initialPermissions)

    React.useEffect(() => {
        if (isOpen && initialPermissions) {
            const perms = initialPermissions as CustomPermissions;
            
            // Exact match helper
            const isMatch = (p: any, target: any) => {
                const keys: (keyof CustomPermissions)[] = [
                    'canViewOrganizationWide', 'canManageSettings', 'canSetGlobalFrequency',
                    'canCreateProjects', 'canCreateGoals', 'canOverrideAIScores', 'canInviteUsers'
                ];
                return keys.every(key => !!p[key] === !!target[key]);
            };

            if (isMatch(perms, seniorPermissions)) {
                setTemplate('senior');
            } else if (isMatch(perms, readOnlyPermissions)) {
                setTemplate('read-only');
            } else if (isMatch(perms, standardPermissions)) {
                setTemplate('standard');
            } else if (isMatch(perms, defaultPermissions)) {
                // If everything is false, it's basically a customized restricted state
                setTemplate('custom');
            } else {
                setTemplate('custom');
            }
            
            setCustomPerms(initialPermissions);
        }
    }, [isOpen, initialPermissions]);

    if (!isOpen) return null

    const handleTemplateSelect = (selected: 'standard' | 'senior' | 'read-only' | 'custom') => {
        setTemplate(selected)
        if (selected === 'standard') setCustomPerms(standardPermissions)
        if (selected === 'senior') setCustomPerms(seniorPermissions)
        if (selected === 'read-only') setCustomPerms(readOnlyPermissions)
    }

    const handleToggle = (key: keyof CustomPermissions) => {
        setCustomPerms(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
        // Automatically switch to custom template when modifying individual permissions
        if (template !== 'custom') {
            setTemplate('custom')
        }
    }

    const handleSave = () => {
        if (onSave) {
            onSave(template, customPerms)
        }
        onClose()
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }} onClick={onClose}>
            <div
                style={{
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius['2xl'],
                    padding: '32px',
                    boxShadow: shadows.cardHover,
                    animation: 'modalSlideUp 0.3s cubic-bezier(0.22, 0.68, 0, 1) both'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, marginBottom: '8px', letterSpacing: '-0.3px' }}>
                        Manage Permissions
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.text3, lineHeight: 1.5 }}>
                        Select a role template for <span style={{ color: colors.text, fontWeight: 600 }}>{employeeName}</span> or grant custom permissions.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Templates */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.text3,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '12px'
                        }}>
                            Permission Template
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { id: 'standard', label: 'Standard', desc: 'Can invite users, create projects/goals, override scores.' },
                                { id: 'senior', label: 'Senior', desc: 'Standard + org-wide view, manage settings/frequency.' },
                                { id: 'read-only', label: 'Read-Only', desc: 'View org-wide data only. E.g., for executives/VPs.' },
                                { id: 'custom', label: 'Custom', desc: 'Granular control over all permissions.' }
                            ].map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => handleTemplateSelect(t.id as any)}
                                    style={{
                                        padding: '16px',
                                        background: template === t.id ? colors.accentGlow : colors.surface2,
                                        border: `1px solid ${template === t.id ? colors.accent : colors.border}`,
                                        borderRadius: radius.xl,
                                        cursor: 'pointer',
                                        transition: `all ${animation.fast}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            color: template === t.id ? colors.accent : colors.text
                                        }}>
                                            {t.label}
                                        </div>
                                        {template === t.id && <Icon name="check" size={14} color={colors.accent} />}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.4 }}>
                                        {t.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Permissions List */}
                    {template === 'custom' && (
                        <div style={{ 
                            marginTop: '8px', 
                            borderTop: `1px solid ${colors.border}`, 
                            paddingTop: '20px',
                            animation: 'fadeIn 0.3s ease both'
                        }}>
                            <label style={{
                                display: 'block',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: colors.text3,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '16px'
                            }}>
                                Individual Permissions
                            </label>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {PERMISSION_CONFIG.map(perm => (
                                    <div 
                                        key={perm.key} 
                                        onClick={() => handleToggle(perm.key as keyof CustomPermissions)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            padding: '12px',
                                            background: colors.surface2,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: radius.lg,
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`
                                        }}
                                    >
                                        <div style={{ 
                                            marginRight: '12px', 
                                            marginTop: '2px',
                                            width: '18px', 
                                            height: '18px', 
                                            borderRadius: '4px',
                                            border: `1px solid ${customPerms[perm.key as keyof CustomPermissions] ? colors.accent : colors.text3}`,
                                            background: customPerms[perm.key as keyof CustomPermissions] ? colors.accent : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: `all ${animation.fast}`
                                        }}>
                                            {customPerms[perm.key as keyof CustomPermissions] && <Icon name="check" size={12} color="#fff" />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ 
                                                fontSize: '13.5px', 
                                                fontWeight: 600, 
                                                color: perm.danger ? colors.warn : colors.text,
                                                marginBottom: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {perm.label}
                                                {perm.danger && <Icon name="alert" size={12} color={colors.warn} />}
                                            </div>
                                            <div style={{ fontSize: '11.5px', color: colors.text3 }}>{perm.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Apply Permissions</Button>
                </div>
            </div>

            <style jsx>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
        </div>
    )
}

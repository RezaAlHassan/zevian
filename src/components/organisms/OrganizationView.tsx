"use client"

import React, { useState } from 'react'
import { DEFAULT_ORG_METRICS } from '@/constants/metrics'
import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { Card, InviteModal } from '@/components/molecules'
import { StatusPill } from '@/components/atoms/StatusPill'
import { Organization, Employee, CustomMetric } from '@/types'
import { updateOrganizationAction, createCustomMetricAction, updateCustomMetricAction, deleteCustomMetricAction } from '@/app/actions/organizationActions'
import { updateEmployeePermissionsAction } from '@/app/actions/employeeActions'
import { updateManagerSettingsAction } from '@/app/actions/managerSettingsActions'
import { ManagePermissionsModal } from '@/components/organisms/ManagePermissionsModal'
import { useRouter, useSearchParams } from 'next/navigation'

type TabId = 'general' | 'metrics' | 'users' | 'advanced'

interface Props {
    organization?: Organization
    employees: Employee[]
    customMetrics: CustomMetric[]
    currentUserPermissions?: {
        canInviteUsers?: boolean
        canManageSettings?: boolean
        canSetGlobalFrequency?: boolean
        isAccountOwner?: boolean
    }
    managerSettings?: any
}

export function OrganizationView({ organization, employees, customMetrics, currentUserPermissions, managerSettings }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const canManageSettings = currentUserPermissions?.isAccountOwner || currentUserPermissions?.canManageSettings
    const defaultTab = canManageSettings ? 'general' : 'users'
    const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) || defaultTab)

    const [localEmployees, setLocalEmployees] = useState(employees)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    React.useEffect(() => {
        setLocalEmployees(employees)
    }, [employees])

    React.useEffect(() => {
        const tab = searchParams.get('tab') as TabId
        if (tab && ['general', 'metrics', 'users', 'advanced'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    React.useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [successMessage])

    const [goalWeight, setGoalWeight] = useState(organization?.goalWeight ?? 70)
    const [orgName, setOrgName] = useState(organization?.name ?? "Acme Inc")
    const [isSaving, setIsSaving] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [selectedEmployeeForPermissions, setSelectedEmployeeForPermissions] = useState<Employee | null>(null)
    const memberCount = 7

    const metrics = DEFAULT_ORG_METRICS

    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(organization?.selectedMetrics ?? ['communication', 'delivery', 'quality', 'ownership', 'collaboration'])

    const handleSaveMetrics = async () => {
        setIsSaving(true)
        try {
            const result = await updateOrganizationAction({ selectedMetrics })
            if (result.success) {
                // Success feedback if needed
            } else {
                alert(result.error || 'Failed to save metrics')
            }
        } catch (error) {
            console.error('Save metrics error:', error)
            alert('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    const [showNewMetric, setShowNewMetric] = useState(false)
    const [newMetricName, setNewMetricName] = useState('')
    const [newMetricDesc, setNewMetricDesc] = useState('')
    const [isSavingMetric, setIsSavingMetric] = useState(false)

    const handleCreateCustomMetric = async () => {
        if (!newMetricName.trim()) return
        setIsSavingMetric(true)
        try {
            const result = await createCustomMetricAction({ name: newMetricName, description: newMetricDesc, isActive: true })
            if (result.success) {
                setShowNewMetric(false)
                setNewMetricName('')
                setNewMetricDesc('')
                router.refresh()
            } else {
                alert(result.error || 'Failed to align')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSavingMetric(false)
        }
    }

    const handleToggleCustomMetric = async (id: string, currentActive: boolean) => {
        try {
            await updateCustomMetricAction(id, { isActive: !currentActive })
            router.refresh()
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteCustomMetric = async (id: string) => {
        if (confirm('Are you sure you want to delete this custom metric?')) {
            try {
                await deleteCustomMetricAction(id)
                router.refresh()
            } catch (e) {
                console.error(e)
            }
        }
    }


    const toggleMetric = (id: string) => {
        setSelectedMetrics(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    const [submissionPolicy, setSubmissionPolicy] = useState({
        allowLate: organization?.aiConfig?.allowLate ?? true,
        allowLateSubmissions: managerSettings?.allow_late_submissions ?? organization?.aiConfig?.allowLateSubmissions ?? true,
        requireReport: organization?.aiConfig?.requireReport ?? true,
        notifyManager: organization?.aiConfig?.notifyManager ?? false,
        gracePeriodDays: managerSettings?.grace_period_days ?? 0,
        backdateLimitDays: managerSettings?.backdate_limit_days ?? 7,
        globalFrequency: managerSettings?.global_frequency ?? true,
        reportFrequency: managerSettings?.report_frequency || 'weekly'
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 1. Update Organization Settings
            await updateOrganizationAction({ 
                name: orgName,
                goalWeight: goalWeight,
                aiConfig: {
                    ...organization?.aiConfig,
                    ...submissionPolicy
                }
            })

            // 2. Update Manager Settings
            await updateManagerSettingsAction({
                allow_late_submissions: submissionPolicy.allowLateSubmissions,
                grace_period_days: submissionPolicy.gracePeriodDays,
                backdate_limit_days: submissionPolicy.backdateLimitDays,
                global_frequency: submissionPolicy.globalFrequency,
                report_frequency: submissionPolicy.reportFrequency
            })

            router.refresh()
            alert('Settings saved successfully')
        } catch (error: any) {
            console.error('Failed to save settings:', error)
            alert('Failed to save settings: ' + (error.message || 'Unknown error'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', background: colors.bg }}>
            {/* Left Rail Navigation */}
            <nav style={{
                width: '200px',
                flexShrink: 0,
                borderRight: `1px solid ${colors.border}`,
                padding: '20px 12px',
                overflowY: 'auto'
            }}>
                {[
                    { id: 'general', label: 'General', icon: 'settings' },
                    { id: 'metrics', label: 'Metrics', icon: 'target' },
                    { id: 'users', label: 'Users', icon: 'users' },
                    { id: 'advanced', label: 'Advanced', icon: 'sparkles', danger: true },
                ].filter(tab => {
                    if (tab.id === 'general' || tab.id === 'metrics' || tab.id === 'advanced') {
                        return currentUserPermissions?.isAccountOwner || currentUserPermissions?.canManageSettings
                    }
                    return true
                }).map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabId)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '9px',
                            cursor: 'pointer',
                            color: activeTab === tab.id ? (tab.danger ? colors.danger : colors.accent) : colors.text3,
                            fontSize: '13px',
                            fontWeight: 600,
                            background: activeTab === tab.id ? (tab.danger ? colors.dangerGlow : colors.accentGlow) : 'transparent',
                            marginBottom: '2px',
                            transition: `all ${animation.fast}`
                        }}
                    >
                        <Icon name={tab.icon as any} size={15} color={activeTab === tab.id ? (tab.danger ? colors.danger : colors.accent) : colors.text3} />
                        {tab.label}
                    </div>
                ))}
            </nav>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 60px' }}>
                {activeTab === 'general' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card title="General Information" icon="settings">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', marginBottom: '8px' }}>Organization Name</div>
                                    <input
                                        style={{ width: '100%', padding: '10px 14px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, outline: 'none' }}
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                    />
                                    <div style={{ fontSize: '12px', color: colors.text3, marginTop: '8px' }}>This appears on report PDFs and invitation emails.</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', marginBottom: '8px' }}>Plan</div>
                                    <div style={{ padding: '12px 16px', background: colors.accentGlow, border: `1px solid ${colors.accent}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.accent }}>Pro Plan</div>
                                            <div style={{ fontSize: '11px', color: colors.text2 }}>{memberCount} of 50 seats used</div>
                                        </div>
                                        <Button variant="secondary" size="sm">Manage Billing</Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card title="AI Evaluation Configuration" icon="sparkles">
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', marginBottom: '12px' }}>Score Weighting</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: colors.text2, marginBottom: '8px' }}>Goal Criteria Weight</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <input
                                            type="range"
                                            min="60" max="90"
                                            value={goalWeight}
                                            onChange={(e) => setGoalWeight(parseInt(e.target.value))}
                                            style={{ flex: 1, accentColor: colors.accent }}
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.accent, minWidth: '36px' }}>{goalWeight}%</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: colors.text3, marginTop: '4px' }}>Min 60% · Max 90%</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: colors.text2, marginBottom: '8px' }}>Org Metrics Weight</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, height: '6px', background: colors.border, borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${100 - goalWeight}%`, background: colors.teal, borderRadius: '3px' }} />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.teal, minWidth: '36px' }}>{100 - goalWeight}%</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: colors.text3, marginTop: '4px' }}>Dynamic total · 10% - 40%</div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Reporting" icon="calendar">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Global Reporting Frequency</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>When enabled, all projects use this default unless overridden.</div>
                                    </div>
                                    <div 
                                        onClick={() => setSubmissionPolicy(prev => ({ ...prev, globalFrequency: !prev.globalFrequency }))}
                                        style={{ 
                                            width: '40px', height: '22px', borderRadius: '11px', background: submissionPolicy.globalFrequency ? colors.accent : colors.border,
                                            position: 'relative', cursor: 'pointer', transition: `all ${animation.fast}`
                                        }}
                                    >
                                        <div style={{ 
                                            position: 'absolute', top: '2px', left: submissionPolicy.globalFrequency ? '20px' : '2px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            transition: `all ${animation.fast}`
                                        }} />
                                    </div>
                                </div>

                                {submissionPolicy.globalFrequency && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginLeft: '12px', borderLeft: `2px solid ${colors.border}`, paddingLeft: '16px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text2 }}>Default Frequency</div>
                                        <select 
                                            value={submissionPolicy.reportFrequency}
                                            onChange={(e) => setSubmissionPolicy(prev => ({ ...prev, reportFrequency: e.target.value as any }))}
                                            style={{ 
                                                padding: '6px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, 
                                                borderRadius: '6px', fontSize: '12.5px', color: colors.text, outline: 'none'
                                            }}
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="bi-weekly">Bi-weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                )}

                                <div style={{ height: '1px', background: colors.border }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Allow Late Submissions</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Enable employees to submit reports for past dates (up to 7 days).</div>
                                    </div>
                                    <div 
                                        onClick={() => setSubmissionPolicy(prev => ({ ...prev, allowLateSubmissions: !prev.allowLateSubmissions }))}
                                        style={{ 
                                            width: '40px', height: '22px', borderRadius: '11px', background: submissionPolicy.allowLateSubmissions ? colors.accent : colors.border,
                                            position: 'relative', cursor: 'pointer', transition: `all ${animation.fast}`
                                        }}
                                    >
                                        <div style={{ 
                                            position: 'absolute', top: '2px', left: submissionPolicy.allowLateSubmissions ? '20px' : '2px',
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            transition: `all ${animation.fast}`
                                        }} />
                                    </div>
                                </div>


                                {submissionPolicy.allowLateSubmissions && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginLeft: '12px', borderLeft: `2px solid ${colors.border}`, paddingLeft: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>Reporting Grace Period</div>
                                            <div style={{ fontSize: '12px', color: colors.text3 }}>Delay missed report flagging. Capped based on frequency.</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="number"
                                                min="0"
                                                max="15"
                                                value={submissionPolicy.gracePeriodDays}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    // Clamping logic will happen on save or we can do it here if we know the frequency
                                                    setSubmissionPolicy(prev => ({ ...prev, gracePeriodDays: val }));
                                                }}
                                                style={{ width: '60px', padding: '6px 10px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, textAlign: 'center', fontWeight: 700 }}
                                            />
                                            <span style={{ fontSize: '12px', color: colors.text3, fontWeight: 600 }}>days</span>
                                        </div>
                                    </div>
                                )}
                                <div style={{ height: '1px', background: colors.border }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: colors.surface2, padding: '12px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                                    <Icon name="alert" size={16} color={colors.text3} />
                                    <div style={{ fontSize: '12px', color: colors.text3 }}>
                                        Employees are restricted to <strong>one report per goal</strong> per reporting period (daily, weekly, etc).
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="primary"
                                icon={isSaving ? "refresh" : "check"}
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="fade-in">
                        <Card
                            title="Organizational Metrics"
                            icon="target"
                            action={<div style={{ padding: '4px 12px', background: colors.accentGlow, color: colors.accent, borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{selectedMetrics.length} Active</div>}
                        >
                            <p style={{ fontSize: '13px', color: colors.text3, marginBottom: '24px', lineHeight: 1.6 }}>
                                Select dimensions measured across your organization. These apply to every evaluation separately from goal criteria.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {metrics.map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => toggleMetric(m.id)}
                                        style={{
                                            padding: '16px',
                                            background: selectedMetrics.includes(m.id) ? colors.accentGlow : colors.surface2,
                                            border: `1px solid ${selectedMetrics.includes(m.id) ? colors.accent : colors.border}`,
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: `all ${animation.fast}`,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px'
                                        }}
                                    >
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>{m.cat}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: selectedMetrics.includes(m.id) ? colors.accent : colors.text }}>{m.name}</div>
                                        <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.4, marginTop: '4px' }}>{m.desc}</div>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', border: `1.5px solid ${colors.border}`,
                                            marginLeft: 'auto', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: selectedMetrics.includes(m.id) ? colors.accent : 'transparent',
                                            borderColor: selectedMetrics.includes(m.id) ? colors.accent : colors.border
                                        }}>
                                            {selectedMetrics.includes(m.id) && <Icon name="check" size={10} color="#fff" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <Button
                                variant="primary"
                                icon={isSaving ? "refresh" : "check"}
                                onClick={handleSaveMetrics}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Metrics'}
                            </Button>
                        </div>
                        
                        <div style={{ marginTop: '24px' }}>
                            <Card
                                title="Custom Metrics"
                                icon="sparkles"
                                action={<Button variant="secondary" size="sm" onClick={() => setShowNewMetric(true)}>Add Custom Metric</Button>}
                            >
                                <p style={{ fontSize: '13px', color: colors.text3, marginBottom: '24px', lineHeight: 1.6 }}>
                                    Define your own organization-specific metrics that the AI will evaluate in every report.
                                </p>
                                
                                {showNewMetric && (
                                    <div style={{ padding: '16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text2 }}>New Custom Metric</div>
                                        <input
                                            placeholder="Metric Name (e.g. Innovation)"
                                            style={{ width: '100%', padding: '10px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, outline: 'none' }}
                                            value={newMetricName}
                                            onChange={(e) => setNewMetricName(e.target.value)}
                                        />
                                        <input
                                            placeholder="Description (Optional)"
                                            style={{ width: '100%', padding: '10px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, outline: 'none' }}
                                            value={newMetricDesc}
                                            onChange={(e) => setNewMetricDesc(e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Button variant="secondary" size="sm" onClick={() => setShowNewMetric(false)}>Cancel</Button>
                                            <Button variant="primary" size="sm" icon={isSavingMetric ? "refresh" : "check"} disabled={isSavingMetric || !newMetricName.trim()} onClick={handleCreateCustomMetric}>
                                                {isSavingMetric ? 'Saving...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                {customMetrics.length === 0 && !showNewMetric ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: colors.text3, fontSize: '13px', border: `1px dashed ${colors.border}`, borderRadius: '12px' }}>
                                        No custom metrics defined yet.
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                        {customMetrics.map(m => (
                                            <div
                                                key={m.id}
                                                style={{
                                                    padding: '16px',
                                                    background: m.isActive ? colors.tealGlow : colors.surface2,
                                                    border: `1px solid ${m.isActive ? colors.teal : colors.border}`,
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '4px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                                                    <div 
                                                        onClick={() => handleToggleCustomMetric(m.id, m.isActive)}
                                                        style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px', background: colors.bg, border: `1px solid ${colors.border}` }}
                                                        title={m.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <Icon name={m.isActive ? 'check' : 'x'} size={12} color={m.isActive ? colors.teal : colors.text3} />
                                                    </div>
                                                    <div 
                                                        onClick={() => handleDeleteCustomMetric(m.id)}
                                                        style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px', background: colors.dangerGlow, border: `1px solid ${colors.danger}40` }}
                                                        title="Delete"
                                                    >
                                                        <Icon name="trash" size={12} color={colors.danger} />
                                                    </div>
                                                </div>
                                                
                                                <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>CUSTOM</div>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: m.isActive ? colors.teal : colors.text }}>{m.name}</div>
                                                <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.4, marginTop: '4px', paddingRight: '20px' }}>{m.description || 'No description provided.'}</div>
                                                <div style={{ marginTop: 'auto', paddingTop: '12px', fontSize: '10px', color: m.isActive ? colors.teal : colors.text3, fontWeight: 600 }}>
                                                    {m.isActive ? 'Active for new reports' : 'Inactive'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="fade-in">
                        {successMessage && (
                            <div style={{
                                position: 'fixed',
                                top: '100px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: colors.green,
                                color: '#fff',
                                padding: '12px 24px',
                                borderRadius: radius.lg,
                                boxShadow: shadows.cardHover,
                                zIndex: 1000,
                                fontSize: '14px',
                                fontWeight: 600,
                                animation: 'modalSlideUp 0.3s ease both'
                            }}>
                                <Icon name="check" size={16} style={{ marginRight: '8px' }} />
                                {successMessage}
                            </div>
                        )}
                        <Card title={`Active Members (${localEmployees.length})`} icon="users" action={
                        (currentUserPermissions?.isAccountOwner || currentUserPermissions?.canInviteUsers) ? (
                            <Button variant="primary" size="sm" icon="plus" onClick={() => setShowInviteModal(true)}>Invite Member</Button>
                        ) : null
                    }>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Member</th>
                                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Role</th>
                                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Reports To</th>
                                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Joined</th>
                                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localEmployees.map(e => (
                                        <tr key={e.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getAvatarGradient(e.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                                                        {getInitials(e.name)}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{e.name}</div>
                                                        <div style={{ fontSize: '11px', color: colors.text3 }}>{e.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                    background: e.isAccountOwner ? colors.purpleGlow : (e.role === 'manager' ? colors.accentGlow : colors.surface),
                                                    color: e.isAccountOwner ? colors.purple : (e.role === 'manager' ? colors.accent : colors.text3)
                                                }}>
                                                    {e.isAccountOwner ? 'Owner' : e.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <select
                                                    defaultValue={e.managerId || ''}
                                                    style={{ 
                                                        background: colors.surface2, 
                                                        border: `1px solid ${colors.border}`, 
                                                        borderRadius: '6px', 
                                                        padding: '4px 8px', 
                                                        fontSize: '12px', 
                                                        color: colors.text, 
                                                        outline: 'none',
                                                        width: '140px'
                                                    }}
                                                >
                                                    <option value="">No Manager</option>
                                                    {localEmployees.filter(m => (m.role === 'manager' || m.isAccountOwner) && m.id !== e.id).map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '12px', color: colors.text3 }}>{e.joinDate ? new Date(e.joinDate).toLocaleDateString() : 'N/A'}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {(e.role === 'manager' || e.isAccountOwner) && (
                                                        <Button 
                                                            variant="secondary" 
                                                            size="sm" 
                                                            icon="settings"
                                                            onClick={() => setSelectedEmployeeForPermissions(e)}
                                                        >
                                                            Permissions
                                                        </Button>
                                                    )}
                                                    {!e.isAccountOwner && <Button variant="secondary" size="sm" style={{ color: colors.danger, borderColor: colors.danger + '40' }}>Remove</Button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}





                {activeTab === 'advanced' && (
                    <div className="fade-in">
                        <Card title="Danger Zone" icon="sparkles">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '16px', background: colors.dangerGlow, border: `1px solid ${colors.danger}20`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.danger }}>Reset All Scores</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Permanently delete all AI-generated scores. This cannot be undone.</div>
                                    </div>
                                    <Button variant="secondary" size="sm" style={{ color: colors.danger, borderColor: colors.danger }}>Reset Scores</Button>
                                </div>
                                <div style={{ padding: '16px', background: colors.dangerGlow, border: `1px solid ${colors.danger}20`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.danger }}>Delete Organization</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Permanently delete this organization and all associated data.</div>
                                    </div>
                                    <Button variant="primary" size="sm" style={{ background: colors.danger }}>Delete Org</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
            <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                orgName={orgName}
            />

            <ManagePermissionsModal 
                isOpen={!!selectedEmployeeForPermissions}
                onClose={() => setSelectedEmployeeForPermissions(null)}
                employeeName={selectedEmployeeForPermissions?.name || ''}
                initialPermissions={selectedEmployeeForPermissions?.permissions}
                onSave={async (template, perms) => {
                    if (!selectedEmployeeForPermissions) return;
                    setIsSaving(true);
                    try {
                        const result = await updateEmployeePermissionsAction(selectedEmployeeForPermissions.id, perms);
                        if (!result.success) {
                            alert(result.error || 'Failed to update permissions');
                        } else {
                            setLocalEmployees(prev => prev.map(e => 
                                e.id === selectedEmployeeForPermissions.id 
                                    ? { ...e, permissions: perms } 
                                    : e
                            ));
                            setSuccessMessage('Permissions updated successfully!');
                            router.refresh();
                        }
                    } catch (error) {
                        console.error('Save permissions error:', error);
                        alert('An unexpected error occurred');
                    } finally {
                        setIsSaving(false);
                        setSelectedEmployeeForPermissions(null);
                    }
                }}
            />

            <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.3s ease both;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

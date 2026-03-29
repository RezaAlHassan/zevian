'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { Card } from '@/components/molecules/Card'
import { updateEmployeeProfileAction, updatePasswordAction } from '@/app/actions/employeeActions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AccountViewProps {
    role?: 'manager' | 'employee' | string
    initialEmployee?: any
}

export function AccountView({ role = 'manager', initialEmployee }: AccountViewProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('profile')
    const [userName, setUserName] = useState(initialEmployee?.name || '')
    const [userEmail, setUserEmail] = useState(initialEmployee?.email || '')
    const [jobTitle, setJobTitle] = useState(initialEmployee?.title || '')
    const [dept, setDept] = useState(initialEmployee?.dept || '')

    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSaveProfile = async () => {
        if (!initialEmployee?.id) return
        setIsSaving(true)
        setSaveStatus('idle')
        const res = await updateEmployeeProfileAction(initialEmployee.id, {
            name: userName,
            title: jobTitle,
            dept: dept
        })
        setIsSaving(false)
        if (res.success) {
            setSaveStatus('success')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } else {
            setSaveStatus('error')
        }
    }

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error' | 'mismatch' | 'short'>('idle')
    const [passwordErrorMsg, setPasswordErrorMsg] = useState('')

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) return

        if (newPassword.length < 6) {
            setPasswordStatus('short')
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordStatus('mismatch')
            return
        }

        setIsUpdatingPassword(true)
        setPasswordStatus('idle')
        setPasswordErrorMsg('')

        const res = await updatePasswordAction(newPassword)
        setIsUpdatingPassword(false)

        if (res.success) {
            setPasswordStatus('success')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPasswordStatus('idle'), 3000)
        } else {
            setPasswordStatus('error')
            setPasswordErrorMsg(res.error || 'Failed to update password')
        }
    }

    const [isSigningOutAll, setIsSigningOutAll] = useState(false)

    const handleSignOutAll = async () => {
        setIsSigningOutAll(true)
        const supabase = createClient()
        await supabase.auth.signOut({ scope: 'global' })
        router.push('/login')
        router.refresh()
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'user' },
        { id: 'security', label: 'Security', icon: 'key' },
    ]


    return (
        <div style={{ display: 'flex', height: '100%', background: colors.bg }}>
            {/* Left Rail Navigation */}
            <div style={{ width: '210px', borderRight: `1px solid ${colors.border}`, padding: '20px 12px', background: colors.surface }}>
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '9px',
                            cursor: 'pointer',
                            color: activeTab === tab.id ? colors.accent : colors.text3,
                            fontSize: '13px',
                            fontWeight: 600,
                            background: activeTab === tab.id ? colors.accentGlow : 'transparent',
                            marginBottom: '2px',
                            transition: `all ${animation.fast}`
                        }}
                    >
                        <Icon name={tab.icon as any} size={15} color={activeTab === tab.id ? colors.accent : colors.text3} />
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 60px' }}>
                {activeTab === 'profile' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card title="Profile Information" icon="user">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(91,127,246,0.05), rgba(0,212,170,0.05))' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: getAvatarGradient(userName || 'User'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#fff', boxShadow: shadows.accentGlow }}>
                                        {getInitials(userName || 'User')}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '26px', height: '26px', borderRadius: '50%', background: colors.accent, border: `3px solid ${colors.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Icon name="edit" size={11} color="#fff" />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: colors.text, marginBottom: '4px' }}>{userName}</div>
                                    <div style={{ fontSize: '13px', color: colors.text2, marginBottom: '10px' }}>{jobTitle || 'No Title'} {dept ? `• ${dept}` : ''}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {initialEmployee?.isAccountOwner && <div style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: colors.purpleGlow, color: colors.purple }}>Account Owner</div>}
                                        <div style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: colors.accentGlow, color: colors.accent }}>{role === 'manager' ? 'Pro Plan' : 'Standard'}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: colors.text3, textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Member since</div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>
                                        {initialEmployee?.joinDate ? new Date(initialEmployee.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Display Name</div>
                                    <input
                                        style={inputStyle}
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Job Title</div>
                                    <input
                                        style={inputStyle}
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Department</div>
                                    <input
                                        style={inputStyle}
                                        value={dept}
                                        onChange={(e) => setDept(e.target.value)}
                                        placeholder="Engineering"
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Employee ID</div>
                                    <input
                                        style={{ ...inputStyle, background: `${colors.surface3}80`, cursor: 'not-allowed' }}
                                        value={initialEmployee?.id || 'N/A'}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card title="Contact Information" icon="mail">
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Primary Email</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        style={{ ...inputStyle, flex: 1, borderColor: `${colors.green}40`, background: `${colors.green}05` }}
                                        value={userEmail}
                                        readOnly
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', background: colors.greenGlow, borderRadius: '8px', color: colors.green, fontSize: '11px', fontWeight: 700 }}>
                                        <Icon name="check" size={12} />
                                        VERIFIED
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                            {saveStatus === 'success' && <div className="fade-in" style={{ fontSize: '13px', color: colors.green, fontWeight: 600 }}>Profile saved successfully!</div>}
                            {saveStatus === 'error' && <div className="fade-in" style={{ fontSize: '13px', color: colors.danger, fontWeight: 600 }}>Error saving profile.</div>}
                            <Button variant="primary" icon="check" onClick={handleSaveProfile} disabled={isSaving || !initialEmployee?.id}>
                                {isSaving ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card title="Change Password" icon="key">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                                {/* Removing Current Password as Supabase doesn't natively require it unless we create a custom flow, which is out of scope for a basic update. The user is already authenticated. */}
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>New Password</div>
                                    <input
                                        type="password"
                                        style={inputStyle}
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    {passwordStatus === 'short' && <div style={{ fontSize: '11px', color: colors.danger, marginTop: '4px' }}>Password must be at least 6 characters.</div>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '8px' }}>Confirm New Password</div>
                                    <input
                                        type="password"
                                        style={inputStyle}
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    {passwordStatus === 'mismatch' && <div style={{ fontSize: '11px', color: colors.danger, marginTop: '4px' }}>Passwords do not match.</div>}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <Button
                                        variant="primary"
                                        onClick={handleUpdatePassword}
                                        disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                                    >
                                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                    </Button>
                                    {passwordStatus === 'success' && <span className="fade-in" style={{ fontSize: '13px', color: colors.green, fontWeight: 600 }}>Password updated!</span>}
                                    {passwordStatus === 'error' && <span className="fade-in" style={{ fontSize: '13px', color: colors.danger, fontWeight: 600 }}>{passwordErrorMsg}</span>}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}


                {activeTab === 'billing' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card title="Current Subscription" icon="briefcase">
                            <div style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(91,127,246,0.1), rgba(0,212,170,0.06))', border: `1px solid ${colors.accentBorder}`, borderRadius: '12px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: colors.accent, marginBottom: '4px' }}>Pro Plan</div>
                                        <div style={{ fontSize: '12px', color: colors.text2 }}>$8.00 / user / month • Billed monthly • Renews April 1, 2026</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: colors.accent }}>$56<span style={{ fontSize: '13px', fontWeight: 500, color: colors.text3 }}>/mo</span></div>
                                        <div style={{ fontSize: '11px', color: colors.text3 }}>7 seats active</div>
                                    </div>
                                </div>
                                <div style={{ height: '6px', background: colors.surface3, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                                    <div style={{ height: '100%', width: '14%', background: `linear-gradient(90deg, ${colors.accent}, ${colors.teal})` }} />
                                </div>
                                <div style={{ fontSize: '11.5px', color: colors.text3 }}>7 of 50 available seats used</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ padding: '16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Reports Scored</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: colors.accent }}>247</div>
                                </div>
                                <div style={{ padding: '16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Credits Used</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: colors.teal }}>1.2M</div>
                                </div>
                                <div style={{ padding: '16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Next Invoice</div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: colors.green }}>$56</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '12px' }}>Payment Method</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px' }}>
                                <div style={{ padding: '4px 8px', background: colors.surface3, borderRadius: '6px', fontSize: '12px', fontWeight: 800, color: colors.text2 }}>VISA</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>•••• •••• •••• 4242</div>
                                    <div style={{ fontSize: '11px', color: colors.text3 }}>Expires 09/27</div>
                                </div>
                                <Button variant="secondary" size="sm">Update Card</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Card title="Account Actions" icon="alert" danger>
                            <p style={{ fontSize: '13px', color: colors.text3, marginBottom: '20px', lineHeight: 1.6 }}>
                                These actions affect your personal account. Deleting your account will remove your access to this organization and delete all your personal report history.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '16px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700 }}>Sign Out Everywhere</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Invalidate all active sessions on other devices.</div>
                                    </div>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={handleSignOutAll}
                                        disabled={isSigningOutAll}
                                    >
                                        {isSigningOutAll ? 'Signing out...' : 'Sign Out All'}
                                    </Button>
                                </div>
                                <div style={{ padding: '16px', background: colors.dangerGlow, border: `1px solid ${colors.danger}20`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.danger }}>Delete Personal Account</div>
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Permanently remove your profile and personal data.</div>
                                    </div>
                                    <Button variant="primary" size="sm" style={{ background: colors.danger }}>Delete Account</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

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

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: colors.surface2,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
}

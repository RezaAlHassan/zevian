'use client'

import React, { useState, useEffect } from 'react'
import { colors, radius, animation, shadows } from '@/design-system'
import { Icon, IconName } from '@/components/atoms'
import { Button } from '@/components/atoms/Button'
import Link from 'next/link'
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from '@/app/actions/notificationActions'

interface Notification {
    id: string
    type: 'assignment' | 'team_update' | 'goal' | 'performance' | 'alert' | 'info'
    title: string
    message: string
    linkUrl?: string
    isRead: boolean
    createdAt: string
}

export function NotificationsView() {
    const [filter, setFilter] = useState<'all' | 'unread' | 'assignments' | 'performance'>('all')
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        const result = await getNotificationsAction()
        if (result.success && result.data) {
            setNotifications(result.data as any)
            setUserId(result.userId || null)
        }
        setLoading(false)
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead
        if (filter === 'assignments') return n.type === 'assignment'
        if (filter === 'performance') return n.type === 'performance'
        return true
    })

    const markAllRead = async () => {
        if (!userId) return
        // Optimistic update
        const previousNotifs = [...notifications]
        setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        
        const result = await markAllAsReadAction(userId)
        if (!result.success) {
            setNotifications(previousNotifs)
            // Error handling
        }
    }

    const toggleRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        
        // Optimistic update
        const previousNotifs = [...notifications]
        const targetNotif = notifications.find(n => n.id === id)
        if (!targetNotif) return
        
        const newStatus = !targetNotif.isRead
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: newStatus } : n))
        
        if (newStatus) {
            const result = await markAsReadAction(Number(id))
            if (!result.success) {
                setNotifications(previousNotifs)
            }
        }
    }

    const getTypeStyles = (type: Notification['type']) => {
        switch (type) {
            case 'assignment': return { color: colors.accent, icon: 'briefcase' as IconName, bg: colors.accentGlow }
            case 'performance': return { color: colors.teal, icon: 'chart' as IconName, bg: colors.tealGlow }
            case 'goal': return { color: colors.purple, icon: 'target' as IconName, bg: colors.purpleGlow }
            case 'team_update': return { color: colors.green, icon: 'users' as IconName, bg: colors.greenGlow }
            case 'alert': return { color: colors.danger, icon: 'alert' as IconName, bg: colors.dangerGlow }
            default: return { color: colors.text2, icon: 'bell' as IconName, bg: colors.surface3 }
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <div className="spinner" />
                <style jsx>{`
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid ${colors.border};
                        border-top: 4px solid ${colors.accent};
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        )
    }

    return (
        <div className="fade-in" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {['all', 'unread', 'assignments', 'performance'].map((t) => (
                        <div
                            key={t}
                            onClick={() => setFilter(t as any)}
                            style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: filter === t ? colors.accent : colors.text3,
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: radius.md,
                                background: filter === t ? colors.accentGlow : 'transparent',
                                transition: `all ${animation.fast}`,
                                textTransform: 'capitalize'
                            }}
                        >
                            {t}
                        </div>
                    ))}
                </div>
                <Button variant="secondary" size="sm" icon="check" onClick={markAllRead}>Mark all as read</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((n) => {
                        const style = getTypeStyles(n.type)
                        return (
                            <Link key={n.id} href={n.linkUrl || '#'} style={{ textDecoration: 'none' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '16px',
                                        padding: '16px',
                                        background: n.isRead ? colors.surface : 'rgba(91,127,246,0.03)',
                                        border: `1px solid ${n.isRead ? colors.border : 'rgba(91,127,246,0.2)'}`,
                                        borderLeft: n.isRead ? `1px solid ${colors.border}` : `3px solid ${colors.accent}`,
                                        borderRadius: radius.xl,
                                        transition: `all ${animation.fast}`,
                                        position: 'relative'
                                    }}
                                    className="notif-card"
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: style.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Icon name={style.icon} size={18} color={style.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '14.5px', fontWeight: 700, color: colors.text }}>{n.title}</div>
                                            <div style={{ fontSize: '11px', color: colors.text3 }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <p style={{ fontSize: '13px', color: colors.text2, margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                                    </div>
                                    <div
                                        onClick={(e) => toggleRead(n.id, e)}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: n.isRead ? colors.border : colors.accent,
                                            marginTop: '6px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </Link>
                        )
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: colors.text3 }}>
                        <Icon name="bell" size={48} color={colors.border} style={{ marginBottom: '16px' }} />
                        <div style={{ fontSize: '15px', fontWeight: 600 }}>No notifications found</div>
                        <div style={{ fontSize: '13px' }}>You're all caught up!</div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .fade-in { animation: fadeIn 0.4s ease both; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .notif-card:hover {
          border-color: ${colors.borderHover} !important;
          background: ${colors.surface2} !important;
          transform: translateY(-2px);
          box-shadow: ${shadows.cardHover};
        }
      `}</style>
        </div>
    )
}

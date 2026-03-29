'use client'

import React, { useState } from 'react'
import { colors, layout, typography, radius, animation, shadows } from '@/design-system'
import { Icon, Avatar } from '@/components/atoms'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title: string
  subtitle?: string
  userName?: string
  showViewSwitcher?: boolean
}

export function Header({ title, subtitle, userName = 'JD', showViewSwitcher = false }: HeaderProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view') || 'org'
  
  const currentView = viewParam === 'direct' ? 'Direct Reports' : 'Organizational View'

  const views = [
    { label: 'Direct Reports', value: 'direct' },
    { label: 'Organizational View', value: 'org' }
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleViewChange = (newView: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    router.push(`?${params.toString()}`)
    setIsViewOpen(false)
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: layout.sidebarWidth,
        height: layout.headerHeight,
        background: 'rgba(10,12,16,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 100,
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: colors.text,
            letterSpacing: '-0.2px',
            fontFamily: typography.fonts.display,
            margin: 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <span style={{ fontSize: '11px', color: colors.text3, fontWeight: 500 }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ flex: 1 }} />


      {/* View Switcher Dropdown */}
      {showViewSwitcher && (
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsViewOpen(!isViewOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              fontSize: '12.5px',
              fontWeight: 600,
              color: colors.text2,
              cursor: 'pointer',
              transition: `all ${animation.fast}`,
            }} className="header-control"
          >
            <Icon name="person" size={13} />
            <span>{currentView}</span>
            <Icon name="chevronDown" size={10} />
          </div>

          {isViewOpen && (
            <>
              <div
                onClick={() => setIsViewOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '180px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                boxShadow: shadows.cardHover,
                zIndex: 101,
                padding: '6px',
              }}>
                {views.map(view => (
                  <div
                    key={view.value}
                    onClick={() => handleViewChange(view.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: radius.md,
                      fontSize: '12.5px',
                      fontWeight: currentView === view.label ? 600 : 500,
                      color: currentView === view.label ? colors.accent : colors.text2,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                    className="dropdown-item"
                  >
                    <Icon name={view.value === 'direct' ? 'person' : 'globe'} size={13} />
                    {view.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
        <Link href="/notifications" style={{ textDecoration: 'none' }}>
          <div className="header-icon-btn">
            <Icon name="bell" size={16} />
            <div style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '6px',
              height: '6px',
              background: colors.danger,
              borderRadius: '50%',
            }} />
          </div>
        </Link>
      </div>

      {/* Account Dropdown */}
      <div style={{ position: 'relative', marginLeft: '8px' }}>
        <div
          onClick={() => setIsAccountOpen(!isAccountOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: radius.md,
            transition: `all ${animation.fast}`,
          }}
          className="account-trigger"
        >
          <Avatar name={userName} size="md" />
          <Icon name="chevronDown" size={10} color={colors.text3} />
        </div>

        {isAccountOpen && (
          <>
            <div
              onClick={() => setIsAccountOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: '200px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.xl,
              boxShadow: shadows.cardHover,
              zIndex: 101,
              padding: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border}`, marginBottom: '6px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{userName}</div>
                <div style={{ fontSize: '11px', color: colors.text3 }}>Administrator</div>
              </div>

              <div style={dropdownItemStyle} className="dropdown-item">
                <Icon name="person" size={14} />
                <span>Account Settings</span>
              </div>

              <div 
                style={{ ...dropdownItemStyle, color: colors.danger, borderTop: `1px solid ${colors.border}`, marginTop: '4px', paddingTop: '10px' }} 
                className="dropdown-item"
                onClick={handleLogout}
              >
                <Icon name="logOut" size={14} />
                <span>Logout</span>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .header-control:hover {
          border-color: ${colors.borderHover} !important;
          color: ${colors.text} !important;
        }
        .account-trigger:hover {
          background: ${colors.surface2};
        }
        .header-icon-btn {
          width: 34px;
          height: 34px;
          background: ${colors.surface};
          border: 1px solid ${colors.border};
          border-radius: ${radius.md};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${colors.text3};
          position: relative;
          transition: all ${animation.fast};
        }
        .header-icon-btn:hover {
          border-color: ${colors.borderHover};
          color: ${colors.text2};
          background: ${colors.surface2};
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: ${radius.md};
          font-size: 13px;
          color: ${colors.text2};
          cursor: pointer;
          transition: all ${animation.fast};
        }
        .dropdown-item:hover {
          background: ${colors.surface2};
          color: ${colors.text};
        }
      `}</style>
    </header>
  )
}

const dropdownItemStyle: React.CSSProperties = {
  // Mostly handled by CSS for hover
}
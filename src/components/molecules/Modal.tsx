'use client'

import React, { useEffect } from 'react'
import { colors, radius, animation, typography, shadows } from '@/design-system'
import { Portal } from '@/components/atoms/Portal'
import { Icon } from '@/components/atoms/Icon'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '540px' }: ModalProps) {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <Portal>
            <div 
                style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    background: 'rgba(5, 7, 10, 0.82)', 
                    backdropFilter: 'blur(8px)', 
                    zIndex: 1000, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '24px'
                }}
                onClick={onClose}
            >
                <div 
                    style={{ 
                        width: '100%',
                        maxWidth: maxWidth, 
                        maxHeight: 'calc(100vh - 48px)', 
                        background: colors.surface, 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: radius.xl, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        boxShadow: shadows.cardHover,
                        position: 'relative',
                        overflow: 'hidden',
                        animation: `modalScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)`
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{ 
                        padding: '20px 24px', 
                        borderBottom: `1px solid ${colors.border}`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        flexShrink: 0
                    }}>
                        {title ? (
                            <h2 style={{ 
                                fontSize: '16px', 
                                fontWeight: 700, 
                                color: colors.text, 
                                fontFamily: typography.fonts.display,
                                margin: 0
                            }}>
                                {title}
                            </h2>
                        ) : <div />}
                        
                        <button 
                            onClick={onClose}
                            style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: radius.md, 
                                background: 'transparent', 
                                border: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer', 
                                color: colors.text3,
                                transition: `all ${animation.fast}`,
                                marginLeft: 'auto'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = colors.surface2
                                e.currentTarget.style.color = colors.text
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = colors.text3
                            }}
                        >
                            <Icon name="x" size={14} />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {children}
                    </div>
                </div>

                <style jsx global>{`
                    @keyframes modalScaleIn {
                        from { opacity: 0; transform: scale(0.96) translateY(20px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>
            </div>
        </Portal>
    )
}

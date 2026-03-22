'use client'

import React, { useState, useRef, useEffect } from 'react'
import { colors, radius, animation, shadows, typography } from '@/design-system'
import { Icon, Calendar } from '@/components/atoms'

interface RangePickerProps {
    onRangeSelect: (start: Date, end: Date) => void
    initialStart?: Date
    initialEnd?: Date
    placeholder?: string
}

export function RangePicker({
    onRangeSelect,
    initialStart,
    initialEnd,
    placeholder = 'Select date range'
}: RangePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [range, setRange] = useState<{ start: Date | null, end: Date | null }>({
        start: initialStart || null,
        end: initialEnd || null
    })
    const containerRef = useRef<HTMLDivElement>(null)

    const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    
    const displayText = range.start && range.end 
        ? `${format(range.start)} — ${format(range.end)}`
        : placeholder

    const handleSelect = (start: Date, end: Date) => {
        setRange({ start, end })
        onRangeSelect(start, end)
        setIsOpen(false)
    }

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: colors.surface2,
                    border: `1px solid ${isOpen ? colors.accent : colors.border}`,
                    borderRadius: radius.md,
                    fontSize: '14px',
                    color: range.start ? colors.text : colors.text3,
                    cursor: 'pointer',
                    transition: `all ${animation.fast}`,
                    outline: 'none',
                    minHeight: '42px'
                }}
            >
                <Icon name="calendar" size={16} color={range.start ? colors.accent : colors.text3} />
                <span style={{ flex: 1, fontWeight: 500 }}>{displayText}</span>
                <Icon name="chevronDown" size={12} color={colors.text3} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    boxShadow: shadows.cardHover,
                    zIndex: 100,
                    padding: '4px',
                    animation: `fadeIn 0.2s ease`
                }}>
                    <Calendar 
                        onRangeSelect={handleSelect} 
                        initialStart={range.start || undefined} 
                        initialEnd={range.end || undefined} 
                    />
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

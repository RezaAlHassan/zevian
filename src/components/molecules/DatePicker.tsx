'use client'

import React, { useState, useEffect } from 'react'
import { colors, radius, animation, shadows } from '@/design-system'
import { Icon, Calendar } from '@/components/atoms'
import { format } from 'date-fns'

interface DatePickerProps {
    selectedDate?: string // YYYY-MM-DD
    onDateChange: (date: string) => void
    minDate?: Date
    maxDate?: Date
    hasWarning?: boolean
    className?: string
}

export function DatePicker({
    selectedDate,
    onDateChange,
    minDate,
    maxDate,
    hasWarning,
    className
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    const displayFormat = (dateStr?: string) => {
        if (!dateStr) return 'Select Date'
        try {
            return format(new Date(dateStr + 'T12:00:00'), 'MMM dd, yyyy')
        } catch (e) {
            return 'Invalid Date'
        }
    }

    const handleDateSelect = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        
        onDateChange(`${y}-${m}-${d}`)
        setIsOpen(false)
    }

    return (
        <div style={{ position: 'relative' }} className={className}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '10px 16px',
                    background: colors.surface,
                    border: `1.5px solid ${isOpen ? colors.accent : (hasWarning ? colors.warn : colors.border)}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: colors.text,
                    cursor: 'pointer',
                    transition: `all ${animation.fast}`,
                    boxShadow: isOpen ? `0 2px 8px ${colors.accent}20` : (hasWarning ? `0 2px 8px ${colors.warn}30` : 'none'),
                    minWidth: '160px'
                }}
                className="date-selector"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="calendar" size={14} color={colors.accent} />
                    <span>{displayFormat(selectedDate)}</span>
                </div>
                <Icon name="chevronDown" size={12} color={colors.text3} />
            </div>

            {isOpen && (
                <>
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.lg,
                        boxShadow: shadows.cardHover,
                        zIndex: 101,
                        padding: '6px'
                    }}>
                        <Calendar 
                            mode="single"
                            onSelect={handleDateSelect}
                            initialDate={selectedDate ? new Date(selectedDate + 'T12:00:00') : undefined}
                            minDate={minDate}
                            maxDate={maxDate}
                        />
                    </div>
                </>
            )}

            <style jsx>{`
                .date-selector:hover {
                    border-color: ${colors.borderHover} !important;
                    background: ${colors.surface2} !important;
                }
            `}</style>
        </div>
    )
}

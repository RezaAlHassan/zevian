'use client'

import React, { useState, useEffect } from 'react'
import { colors, radius, animation, shadows } from '@/design-system'
import { Icon, Calendar } from '@/components/atoms'
import { 
    format, 
    subDays, 
    startOfMonth, 
    endOfMonth, 
    subMonths, 
    isSameDay,
    parseISO,
    startOfDay,
    endOfDay
} from 'date-fns'

interface DateRangeSelectorProps {
    startDate?: string // ISO string
    endDate?: string   // ISO string
    onRangeChange: (start: string, end: string) => void
}

export function DateRangeSelector({
    startDate,
    endDate,
    onRangeChange
}: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)

    // Helper to format for display
    const displayFormat = (dateStr?: string) => {
        if (!dateStr) return '...'
        try {
            return format(parseISO(dateStr), 'MMM dd, yyyy')
        } catch (e) {
            return 'Invalid Date'
        }
    }

    const selectedRange = startDate && endDate 
        ? `${displayFormat(startDate)} — ${displayFormat(endDate)}`
        : 'Select Range'

    const handleRangeSelect = (start: Date, end: Date) => {
        onRangeChange(start.toISOString(), end.toISOString())
        setIsOpen(false)
        setShowCalendar(false)
    }

    const setQuickRange = (range: string) => {
        const now = new Date()
        let start = startOfDay(now)
        let end = endOfDay(now)

        switch (range) {
            case 'Today':
                start = startOfDay(now)
                end = endOfDay(now)
                break
            case 'Last 7 Days':
                start = startOfDay(subDays(now, 7))
                end = endOfDay(now)
                break
            case 'Last 30 Days':
                start = startOfDay(subDays(now, 30))
                end = endOfDay(now)
                break
            case 'This Month':
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case 'Last Month':
                const lastMonth = subMonths(now, 1)
                start = startOfMonth(lastMonth)
                end = endOfMonth(lastMonth)
                break
            default:
                return
        }

        onRangeChange(start.toISOString(), end.toISOString())
        setIsOpen(false)
    }

    const ranges = [
        'Today',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
        'Custom Range'
    ]

    return (
        <div style={{ position: 'relative' }}>
            <div
                onClick={() => {
                    setIsOpen(!isOpen)
                    setShowCalendar(false)
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.md,
                    fontSize: '12.5px',
                    color: colors.text2,
                    cursor: 'pointer',
                    transition: `all ${animation.fast}`,
                }}
                className="date-range-selector"
            >
                <Icon name="calendar" size={13} />
                <span style={{ fontWeight: 500 }}>{selectedRange}</span>
                <Icon name="chevronDown" size={10} />
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
                        right: 0,
                        width: showCalendar ? 'auto' : '180px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.lg,
                        boxShadow: shadows.cardHover,
                        zIndex: 101,
                        padding: '6px',
                        display: 'flex',
                        flexDirection: showCalendar ? 'row' : 'column'
                    }}>
                        {!showCalendar ? (
                            ranges.map(range => (
                                <div
                                    key={range}
                                    onClick={() => {
                                        if (range === 'Custom Range') {
                                            setShowCalendar(true)
                                        } else {
                                            setQuickRange(range)
                                        }
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: radius.md,
                                        fontSize: '12.5px',
                                        color: colors.text2,
                                        cursor: 'pointer',
                                        transition: `all ${animation.fast}`,
                                    }}
                                    className="dropdown-item"
                                >
                                    {range}
                                </div>
                            ))
                        ) : (
                            <Calendar 
                                onRangeSelect={handleRangeSelect} 
                                initialStart={startDate ? parseISO(startDate) : undefined}
                                initialEnd={endDate ? parseISO(endDate) : undefined}
                            />
                        )}
                    </div>
                </>
            )}

            <style jsx>{`
                .date-range-selector:hover {
                    border-color: ${colors.borderHover} !important;
                    color: ${colors.text} !important;
                    background: ${colors.surface2} !important;
                }
                .dropdown-item:hover {
                    background: ${colors.surface2};
                    color: ${colors.text};
                }
            `}</style>
        </div>
    )
}

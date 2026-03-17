'use client'

import React, { useState } from 'react'
import { colors, radius, animation, shadows } from '@/design-system'
import { Icon, Calendar } from '@/components/atoms'

interface DateRangeSelectorProps {
    startDate?: string
    endDate?: string
}

export function DateRangeSelector({
    startDate = 'Feb 01, 2026',
    endDate = 'Mar 07, 2026'
}: DateRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedRange, setSelectedRange] = useState(`${startDate} — ${endDate}`)
    const [showCalendar, setShowCalendar] = useState(false)

    const ranges = [
        'Today',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
        'Custom Range'
    ]

    const handleRangeSelect = (start: Date, end: Date) => {
        const format = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        setSelectedRange(`${format(start)} — ${format(end)}`)
        setIsOpen(false)
        setShowCalendar(false)
    }

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
                                            setSelectedRange(range === 'This Month' ? 'Mar 01, 2026 — Mar 31, 2026' : range)
                                            setIsOpen(false)
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
                            <Calendar onRangeSelect={handleRangeSelect} />
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

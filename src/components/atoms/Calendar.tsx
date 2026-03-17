'use client'

import React, { useState } from 'react'
import { colors, radius, animation, typography } from '@/design-system'
import { Icon } from '@/components/atoms/Icon'

interface CalendarProps {
    onRangeSelect: (start: Date, end: Date) => void
    initialStart?: Date
    initialEnd?: Date
}

export function Calendar({ onRangeSelect, initialStart, initialEnd }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [rangeStart, setRangeStart] = useState<Date | null>(initialStart || null)
    const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd || null)

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const prevMonth = () => setCurrentDate(new Date(year, month - 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1))

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(year, month, day)

        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(selectedDate)
            setRangeEnd(null)
        } else if (selectedDate < rangeStart) {
            setRangeEnd(rangeStart)
            setRangeStart(selectedDate)
            onRangeSelect(selectedDate, rangeStart)
        } else {
            setRangeEnd(selectedDate)
            onRangeSelect(rangeStart, selectedDate)
        }
    }

    const isSelected = (day: number) => {
        const d = new Date(year, month, day)
        return (rangeStart && d.getTime() === rangeStart.getTime()) || (rangeEnd && d.getTime() === rangeEnd.getTime())
    }

    const isInRange = (day: number) => {
        if (!rangeStart || !rangeEnd) return false
        const d = new Date(year, month, day)
        return d > rangeStart && d < rangeEnd
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const days = []
    const startDay = firstDayOfMonth(year, month)
    const totalDays = daysInMonth(year, month)

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} />)
    }

    // Actual days
    for (let day = 1; day <= totalDays; day++) {
        const isToday = new Date(year, month, day).getTime() === today.getTime()
        const selected = isSelected(day)
        const inRange = isInRange(day)

        days.push(
            <div
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: selected || isToday ? 700 : 500,
                    cursor: 'pointer',
                    borderRadius: radius.md,
                    position: 'relative',
                    background: selected ? colors.accent : inRange ? `${colors.accent}15` : 'transparent',
                    color: selected ? '#fff' : inRange ? colors.accent : colors.text,
                    transition: `all ${animation.fast}`,
                    zIndex: 1
                }}
                className="calendar-day"
            >
                {day}
                {isToday && !selected && (
                    <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: colors.accent
                    }} />
                )}
            </div>
        )
    }

    return (
        <div style={{ width: '240px', padding: '12px', userSelect: 'none' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>
                    {monthNames[month]} {year}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={prevMonth} style={navBtnStyle}><Icon name="chevronDown" size={12} style={{ transform: 'rotate(90deg)' }} /></button>
                    <button onClick={nextMonth} style={navBtnStyle}><Icon name="chevronDown" size={12} style={{ transform: 'rotate(-90deg)' }} /></button>
                </div>
            </div>

            {/* Weekdays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: colors.text3, padding: '4px 0' }}>{d}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {days}
            </div>

            <style jsx>{`
                .calendar-day:hover {
                    background: ${colors.surface2} !important;
                    color: ${colors.text} !important;
                }
            `}</style>
        </div>
    )
}

const navBtnStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: 'none',
    cursor: 'pointer',
    color: colors.text3,
    transition: `all ${animation.fast}`
}

'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation } from '@/design-system'
import { Modal, RangePicker } from '@/components/molecules'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { grantLeaveAction } from '@/app/actions/leaveActions'
import { useRouter } from 'next/navigation'

interface ApproveLeaveModalProps {
    isOpen: boolean
    onClose: () => void
    employeeId: string
    employeeName: string
}

export function ApproveLeaveModal({ isOpen, onClose, employeeId, employeeName }: ApproveLeaveModalProps) {
    const router = useRouter()
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [leaveType, setLeaveType] = useState<'sick' | 'vacation' | 'personal' | 'other'>('sick')
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        
        if (!startDate || !endDate) {
            setError('Please select a date range.')
            return
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after end date.')
            return
        }

        setLoading(true)
        try {
            const result = await grantLeaveAction({
                employeeId,
                startDate,
                endDate,
                leaveType,
                note
            })

            if (result.error) {
                setError(result.error)
            } else {
                onClose()
                router.refresh()
            }
        } catch (err: any) {
            setError('An unexpected error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Approve Leave for ${employeeName}`}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 24px' }}>
                
                {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(240,68,56,0.1)', color: colors.warn, borderRadius: radius.md, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="alert" size={14} />
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text2 }}>Leave Period</label>
                    <RangePicker 
                        onRangeSelect={(start, end) => {
                            setStartDate(start.toISOString().split('T')[0])
                            setEndDate(end.toISOString().split('T')[0])
                        }}
                        initialStart={startDate ? new Date(startDate) : undefined}
                        initialEnd={endDate ? new Date(endDate) : undefined}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text2 }}>Leave Type</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {(['sick', 'vacation', 'personal', 'other'] as const).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setLeaveType(type)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: leaveType === type ? colors.accent + '20' : colors.surface2,
                                    border: `1px solid ${leaveType === type ? colors.accent : colors.border}`,
                                    borderRadius: radius.md,
                                    color: leaveType === type ? colors.accent : colors.text2,
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    transition: `all ${animation.fast}`
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text2 }}>Note (Optional)</label>
                    <textarea 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Add any relevant details..."
                        style={{ padding: '12px 14px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.text, outline: 'none', fontFamily: typography.fonts.body, fontSize: '14px', minHeight: '80px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Approving...' : 'Approve Leave'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

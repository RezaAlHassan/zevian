'use client'

import React, { useState, useEffect } from 'react'
import { layout, colors } from '@/design-system'
import { EmployeeDashboardView } from '@/components/organisms/EmployeeDashboardView'
import { getDashboardDataAction } from '../../actions/dashboardActions'

import { useSearchParams } from 'next/navigation'

export default function EmployeeDashboardPage() {
    const searchParams = useSearchParams()
    const startDate = searchParams.get('start') || undefined
    const endDate = searchParams.get('end') || undefined

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const res: any = await getDashboardDataAction(undefined, startDate, endDate)
                if (res.error) {
                    setError(res.error)
                } else {
                    setData(res)
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [startDate, endDate])

    if (loading) {
        return (
            <div style={{ padding: layout.contentPadding, textAlign: 'center', color: colors.text3 }}>
                Loading your dashboard...
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ padding: layout.contentPadding, textAlign: 'center', color: colors.warn }}>
                Error loading dashboard: {error}
            </div>
        )
    }

    return (
        <div style={{ padding: layout.contentPadding }}>
            <EmployeeDashboardView data={data} />
        </div>
    )
}

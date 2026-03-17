'use client'

import { useState } from 'react'

/**
 * useScoreReport — triggers server-side AI scoring for a report.
 *
 * Usage:
 *   const { score, loading, error, scoreReport } = useScoreReport()
 *   await scoreReport(reportId)
 */
export function useScoreReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<{
    overall_score:    number
    criterion_scores: Array<{ criterion_id: string; score: number; feedback: string }>
    summary:          string
  } | null>(null)

  async function scoreReport(reportId: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/score-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reportId }),
      })
      if (!res.ok) {
        let errMessage = 'Scoring failed'
        try {
          const errData = await res.json()
          errMessage = errData.error || errMessage
        } catch {
          errMessage = await res.text()
        }
        throw new Error(errMessage)
      }
      const data = await res.json()
      setResult(data)
      return data
    } catch (err: any) {
      setError(err.message ?? 'Scoring failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, scoreReport }
}

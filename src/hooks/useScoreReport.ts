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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/ai/score-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reportId }),
        signal: controller.signal
      })
      clearTimeout(timeoutId);

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
      if (err.name === 'AbortError') {
        setError('AI evaluation took too long. Please try again.');
      } else {
        setError(err.message ?? 'Scoring failed');
      }
      return null
    } finally {
      clearTimeout(timeoutId);
      setLoading(false)
    }
  }

  return { result, loading, error, scoreReport }
}

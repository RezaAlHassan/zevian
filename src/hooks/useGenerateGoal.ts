'use client'

import { useState } from 'react'

interface GeneratedGoal {
  name:         string
  instructions: string
  criteria:     Array<{ name: string; importance: 'low' | 'medium' | 'high' | 'critical' }>
}

/**
 * useGenerateGoal — AI goal generation from free-text description.
 *
 * Usage:
 *   const { result, loading, generate } = useGenerateGoal()
 *   await generate("We are a support team for enterprise clients...")
 */
export function useGenerateGoal() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<GeneratedGoal | null>(null)

  async function generate(description: string): Promise<GeneratedGoal | null> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-goal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ description }),
      })
      if (!res.ok) {
        let errMessage = 'Generation failed'
        try {
          const errData = await res.json()
          errMessage = errData.error || errData.data?.error || errMessage
        } catch {
          errMessage = await res.text()
        }
        throw new Error(errMessage)
      }
      const data: GeneratedGoal = await res.json()
      setResult(data)
      return data
    } catch (err: any) {
      setError(err.message ?? 'Generation failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { result, loading, error, generate }
}

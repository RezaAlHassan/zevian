export interface GeneratedGoal {
    name: string
    instructions: string
    criteria: { name: string; importance: 'low' | 'medium' | 'high' | 'critical'; weight: number }[]
}

export async function generateGoalWithAI(prompt: string): Promise<{ data?: GeneratedGoal; error?: string }> {
    try {
        const response = await fetch('/api/ai/generate-goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        })

        const result = await response.json()

        if (!response.ok) {
            return { error: result.error || 'Failed to generate goal' }
        }

        return { data: result.data }
    } catch (err: any) {
        console.error('Client-side AI fetch error:', err)
        return { error: err.message || 'Network error while generating goal' }
    }
}

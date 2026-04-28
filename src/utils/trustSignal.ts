export interface TrustSignalResult {
    label: string | null
    color: 'green' | 'amber' | 'neutral' | null
    agrees: number
    downs: number
    ups: number
    total: number
}

export function computeTrustSignal(
    calibrations: Array<string>
): TrustSignalResult {
    const total = calibrations.length
    if (total < 3) {
        return { label: null, color: null, agrees: 0, downs: 0, ups: 0, total }
    }

    const agrees = calibrations.filter(c => c === 'agree').length
    const downs = calibrations.filter(c => c === 'adjusted_down').length
    const ups = calibrations.filter(c => c === 'adjusted_up').length

    let label: string | null = null
    let color: 'green' | 'amber' | 'neutral' | null = null

    if (downs / total >= 0.5) {
        label = 'Likely Inflated'
        color = 'amber'
    } else if (agrees / total >= 0.75) {
        label = 'AI Aligned'
        color = 'green'
    } else if (ups / total >= 0.5) {
        label = 'Underscoring'
        color = 'neutral'
    } else {
        label = 'Variable'
        color = 'neutral'
    }

    return { label, color, agrees, downs, ups, total }
}

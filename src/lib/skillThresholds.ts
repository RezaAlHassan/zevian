export const SKILL_STRENGTH_MIN = 8.5
export const SKILL_DEVELOPING_MIN = 7.0

export type SkillCategory = 'strength' | 'developing' | 'weakness'

export interface SkillItem {
    name: string
    score: number
    maxScore: number
    category: SkillCategory
}

export function getSkillCategory(score: number): SkillCategory {
    if (score >= SKILL_STRENGTH_MIN) return 'strength'
    if (score >= SKILL_DEVELOPING_MIN) return 'developing'
    return 'weakness'
}

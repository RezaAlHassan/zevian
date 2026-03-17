import { createServerClient } from '@/lib/supabase/server'
import { KnowledgeBaseView } from '@/components/organisms/KnowledgeBaseView'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Knowledge Base' }

export default async function KnowledgeBasePage({ searchParams }: { searchParams: { project?: string } }) {
    const supabase = createServerClient()
    const projectId = searchParams.project

    // Mock pins for the dummy projects
    const MOCK_PINS: Record<string, any[]> = {
        'mock-1': [
            { id: 'p1', section: 'lexicon', content: 'Phoenix: The internal code name for our high-performance concurrent engine built on Elixir.' },
            { id: 'p2', section: 'priorities', content: 'Latency Reduction: Target is <50ms for all core sync operations.' },
            { id: 'p3', section: 'constraints', content: 'Memory footprint must not exceed 256MB on edge nodes.' }
        ],
        'mock-2': [
            { id: 'p4', section: 'lexicon', content: 'Z-Tokens: Design tokens used for all layout and color properties.' },
            { id: 'p5', section: 'benchmarks', content: 'Lighthouse accessibility score must be 100 on all core components.' }
        ],
        'mock-3': [
            { id: 'p6', section: 'priorities', content: 'Market Penetration: Onboard 50 enterprise partners by end of Q3.' }
        ]
    }

    const MOCK_PROJECT_NAMES: Record<string, string> = {
        'mock-1': 'Phoenix Framework Refactor',
        'mock-2': 'Zevian Design System',
        'mock-3': 'Q3 Market Expansion'
    }

    let pins = []
    let projectName = ''

    if (projectId && projectId.startsWith('mock-')) {
        pins = MOCK_PINS[projectId] || []
        projectName = MOCK_PROJECT_NAMES[projectId] || ''
    } else if (projectId) {
        const { data } = await supabase
            .from('knowledge_pins')
            .select('*')
            .eq('project_id', projectId)
        pins = data || []

        const { data: proj } = await supabase
            .from('projects')
            .select('name')
            .eq('id', projectId)
            .single()
        projectName = (proj as any)?.name || ''
    }

    return (
        <KnowledgeBaseView
            projectId={projectId}
            projectName={projectName}
            pins={pins}
        />
    )
}

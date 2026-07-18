import type { Metadata } from 'next'
import { getUploadGoalsAction } from '@/app/actions/managerUploadActions'
import { UploadDataView } from '@/components/organisms/UploadDataView'

export const metadata: Metadata = { title: 'Submit' }

// Server actions invoked from this route (processUploadAction scores a whole CSV
// via Gemini) can run well past the ~10s default. Raise the function ceiling so a
// multi-row batch completes. Netlify/Vercel clamp this to the plan's max.
export const maxDuration = 60

export default async function UploadDataPage() {
    const result = await getUploadGoalsAction()
    const goals = 'success' in result ? result.goals : []
    const error = 'error' in result ? result.error : null

    return <UploadDataView goals={goals} loadError={error} />
}

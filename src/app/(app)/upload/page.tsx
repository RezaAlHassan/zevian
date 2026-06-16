import type { Metadata } from 'next'
import { getUploadGoalsAction } from '@/app/actions/managerUploadActions'
import { UploadDataView } from '@/components/organisms/UploadDataView'

export const metadata: Metadata = { title: 'Submit' }

export default async function UploadDataPage() {
    const result = await getUploadGoalsAction()
    const goals = 'success' in result ? result.goals : []
    const error = 'error' in result ? result.error : null

    return <UploadDataView goals={goals} loadError={error} />
}

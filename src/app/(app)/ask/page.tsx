import type { Metadata } from 'next'
import { getAskContextAction, getAskSessionAction } from '@/app/actions/askActions'
import { AskView } from './AskView'
import { colors } from '@/design-system'

export const metadata: Metadata = { title: 'Ask' }

export default async function AskPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const result = await getAskContextAction()

    if ('error' in result) {
        return (
            <div style={{ padding: 40, color: colors.text2, fontSize: 14 }}>
                {result.error}
            </div>
        )
    }

    // An incoming question (Ask why / stat card) always takes precedence and starts a clean
    // thread, so we only restore the prior session when entering Ask plainly (no ?q=).
    const incomingQ = searchParams.q
    const hasIncoming = typeof incomingQ === 'string' && incomingQ.trim().length > 0
    const session = hasIncoming ? null : await getAskSessionAction()

    return <AskView initialContext={result.data} initialSession={session} />
}

import { notFound } from 'next/navigation'
import { getEmployeeDetailedDataAction } from '@/app/actions/dashboardActions'
import { EmployeeDetailClient } from './EmployeeDetailClient'

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { start?: string; end?: string; goal?: string }
}) {
  const pageData: any = await getEmployeeDetailedDataAction(params.id, searchParams.start, searchParams.end)

  if (!pageData || pageData.error) {
    notFound()
  }

  return (
    <EmployeeDetailClient
      pageData={pageData}
      id={params.id}
      startDate={searchParams.start}
      endDate={searchParams.end}
      selectedGoalId={searchParams.goal || null}
    />
  )
}

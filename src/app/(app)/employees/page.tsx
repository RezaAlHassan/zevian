import { EmployeesView } from '@/components/organisms/EmployeesView'
import { getEmployeesAction } from '@/app/actions/employeeActions'
import React from 'react'

export const metadata = {
    title: 'Employees | Zevian',
    description: 'Manage your organization members and track performance.',
}

export default async function EmployeesPage() {
    const data = await getEmployeesAction()

    if (data.error || !data.employees) {
        return <EmployeesView employees={[]} />
    }

    return <EmployeesView employees={data.employees as any[]} />
}

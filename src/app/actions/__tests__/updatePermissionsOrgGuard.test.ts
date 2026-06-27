import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getByAuthId, getAuthUser, employeeOrg, upsert } = vi.hoisted(() => ({
  getByAuthId: vi.fn(),
  getAuthUser: vi.fn(),
  employeeOrg: { value: 'org-A' as string | null },
  upsert: vi.fn().mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [{}], error: null }) }),
}))

// Admin client: from('employees').select().eq().single()  and  from('employee_permissions').upsert().select()
const adminClient = {
  from: (table: string) => {
    if (table === 'employees') {
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { organization_id: employeeOrg.value, name: 'Target' }, error: null }),
          }),
        }),
      }
    }
    return { upsert }
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({}),
  createAdminClient: () => adminClient,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/utils/trustSignal', () => ({ computeTrustSignal: vi.fn() }))
vi.mock('@/lib/auth/session', () => ({ getAuthUser, getSessionContext: vi.fn() }))
vi.mock('@/../databaseService2', () => ({
  employeeService: { getByAuthId },
  reportService: {},
  goalService: {},
}))

import { updateEmployeePermissionsAction } from '../employeeActions'

beforeEach(() => {
  upsert.mockClear()
  getAuthUser.mockResolvedValue({ id: 'auth-mgr' })
  getByAuthId.mockResolvedValue({ id: 'mgr-A', role: 'manager', isAccountOwner: false, organizationId: 'org-A' })
})

describe('updateEmployeePermissionsAction — org isolation (admin client bypasses RLS)', () => {
  it('allows a manager to update an employee in their OWN org', async () => {
    employeeOrg.value = 'org-A'
    const res = await updateEmployeePermissionsAction('emp-A', { canCreateGoals: true })
    expect(res).toEqual({ success: true })
    expect(upsert).toHaveBeenCalled()
  })

  it('REJECTS updating an employee in a DIFFERENT org and never writes', async () => {
    employeeOrg.value = 'org-B'
    const res = await updateEmployeePermissionsAction('emp-B', { canCreateGoals: true })
    expect(res).toEqual({ success: false, error: 'Unauthorized' })
    expect(upsert).not.toHaveBeenCalled()
  })

  it('rejects a non-manager caller before touching the admin client', async () => {
    getByAuthId.mockResolvedValue({ id: 'emp-x', role: 'employee', isAccountOwner: false, organizationId: 'org-A' })
    employeeOrg.value = 'org-A'
    const res = await updateEmployeePermissionsAction('emp-A', { canCreateGoals: true })
    expect(res).toEqual({ success: false, error: 'Unauthorized' })
    expect(upsert).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { getSessionContext, getTeamMembers, getStaffMembers, getManagers, getAllReports, getAllGoals } =
  vi.hoisted(() => ({
    getSessionContext: vi.fn(),
    getTeamMembers: vi.fn().mockResolvedValue([]),
    getStaffMembers: vi.fn().mockResolvedValue([]),
    getManagers: vi.fn().mockResolvedValue([]),
    getAllReports: vi.fn().mockResolvedValue([]),
    getAllGoals: vi.fn().mockResolvedValue([]),
  }))

vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => ({}), createAdminClient: () => ({}) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/utils/trustSignal', () => ({ computeTrustSignal: () => ({ label: null }) }))
vi.mock('@/lib/auth/session', () => ({ getSessionContext, getAuthUser: vi.fn() }))
vi.mock('@/../databaseService2', () => ({
  employeeService: { getTeamMembers, getStaffMembers, getManagers },
  reportService: { getAll: getAllReports },
  goalService: { getAll: getAllGoals },
}))

import { getEmployeesAction } from '../employeeActions'

function sessionFor(employee: any) {
  getSessionContext.mockResolvedValue({ userId: 'u', employee, organization: {} })
}

beforeEach(() => {
  getTeamMembers.mockClear()
  getStaffMembers.mockClear()
  getManagers.mockClear()
})

describe('getEmployeesAction — hierarchy & permission scoping', () => {
  it('account owner gets org-wide view (all staff)', async () => {
    sessionFor({ id: 'owner-1', role: 'manager', isAccountOwner: true, permissions: {} })
    const res = await getEmployeesAction()
    expect(res.isSenior).toBe(true)
    expect(res.effectiveView).toBe('org')
    expect(getStaffMembers).toHaveBeenCalled()
    expect(getTeamMembers).not.toHaveBeenCalled()
  })

  it('manager WITH canViewOrganizationWide is senior → org view', async () => {
    sessionFor({ id: 'mgr-1', role: 'manager', isAccountOwner: false, permissions: { canViewOrganizationWide: true } })
    const res = await getEmployeesAction()
    expect(res.isSenior).toBe(true)
    expect(res.effectiveView).toBe('org')
    expect(getStaffMembers).toHaveBeenCalled()
  })

  it('plain manager defaults to direct-reports view (own team only)', async () => {
    sessionFor({ id: 'mgr-2', role: 'manager', isAccountOwner: false, permissions: { canViewOrganizationWide: false } })
    const res = await getEmployeesAction()
    expect(res.isSenior).toBe(false)
    expect(res.effectiveView).toBe('direct')
    expect(getTeamMembers).toHaveBeenCalledWith('mgr-2')
    expect(getStaffMembers).not.toHaveBeenCalled()
  })

  it('plain manager CANNOT escalate to org view by requesting it', async () => {
    sessionFor({ id: 'mgr-3', role: 'manager', isAccountOwner: false, permissions: { canViewOrganizationWide: false } })
    const res = await getEmployeesAction('org')
    expect(res.effectiveView).toBe('direct')
    expect(getTeamMembers).toHaveBeenCalledWith('mgr-3')
    expect(getStaffMembers).not.toHaveBeenCalled()
  })
})

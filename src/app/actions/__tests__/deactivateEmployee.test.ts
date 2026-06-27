import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock the action's dependencies ---
const { update, getByAuthId, getAuthUser } = vi.hoisted(() => ({
  update: vi.fn(),
  getByAuthId: vi.fn(),
  getAuthUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({}),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('@/../databaseService2', () => ({
  employeeService: { update, getByAuthId },
  reportService: {},
  goalService: {},
}))
vi.mock('@/utils/trustSignal', () => ({ computeTrustSignal: vi.fn() }))

vi.mock('@/lib/auth/session', () => ({
  getAuthUser,
  getSessionContext: vi.fn(),
}))

import { deactivateEmployeeAction, reactivateEmployeeAction } from '../employeeActions'

beforeEach(() => {
  update.mockClear()
  getByAuthId.mockReset()
  getAuthUser.mockReset()
})

describe('deactivateEmployeeAction', () => {
  it('sets isActive:false when caller is a manager', async () => {
    getAuthUser.mockResolvedValue({ id: 'auth-1' })
    getByAuthId.mockResolvedValue({ id: 'mgr-1', role: 'manager', isAccountOwner: false })

    const result = await deactivateEmployeeAction('emp-99')

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith('emp-99', { isActive: false })
  })

  it('reactivate sets isActive:true for an account owner', async () => {
    getAuthUser.mockResolvedValue({ id: 'auth-1' })
    getByAuthId.mockResolvedValue({ id: 'own-1', role: 'employee', isAccountOwner: true })

    const result = await reactivateEmployeeAction('emp-99')

    expect(result).toEqual({ success: true })
    expect(update).toHaveBeenCalledWith('emp-99', { isActive: true })
  })

  it('rejects a non-manager / non-owner caller without touching the DB', async () => {
    getAuthUser.mockResolvedValue({ id: 'auth-2' })
    getByAuthId.mockResolvedValue({ id: 'emp-2', role: 'employee', isAccountOwner: false })

    const result = await deactivateEmployeeAction('emp-99')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(update).not.toHaveBeenCalled()
  })

  it('rejects an unauthenticated caller', async () => {
    getAuthUser.mockResolvedValue(null)

    const result = await deactivateEmployeeAction('emp-99')

    expect(result).toEqual({ success: false, error: 'Not authenticated' })
    expect(update).not.toHaveBeenCalled()
  })
})

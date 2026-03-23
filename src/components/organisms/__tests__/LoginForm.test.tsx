import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoginForm } from '../LoginForm'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('LoginForm Component', () => {
  let mockPush: ReturnType<typeof vi.fn>
  let mockRefresh: ReturnType<typeof vi.fn>
  let mockSignInWithPassword: ReturnType<typeof vi.fn>
  let mockFrom: ReturnType<typeof vi.fn>
  let mockSelect: ReturnType<typeof vi.fn>
  let mockEq: ReturnType<typeof vi.fn>
  let mockSingle: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up mock implementations
    mockPush = vi.fn()
    mockRefresh = vi.fn()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })

    mockSignInWithPassword = vi.fn()
    mockSingle = vi.fn()
    mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
      from: mockFrom,
    })
  })

  it('renders login form correctly', () => {
    render(<LoginForm />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('displays error message on failed login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to /my-dashboard for employee role', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: { role: 'employee' },
      error: null,
    })

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'employee@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'employee@example.com', password: 'password123' })
    })

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('employees')
      expect(mockEq).toHaveBeenCalledWith('auth_user_id', 'user-123')
      expect(mockPush).toHaveBeenCalledWith('/my-dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('redirects to /dashboard for admin role', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-456' } },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    })

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('redirects to default /dashboard when role fetching fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'user-789' } },
      error: null,
    })

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    // Suppress console.error for this test as the component logs the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<LoginForm />)

    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'unknown@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'unknown123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })
})

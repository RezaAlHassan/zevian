import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GoalDetailView } from '../GoalDetailView'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

// Mock components that might be complex to render
jest.mock('@/components/atoms/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid={`mock-button-${props.icon || 'default'}`}>
      {children}
    </button>
  ),
}))
jest.mock('@/components/atoms/Icon', () => ({
  Icon: ({ name }: any) => <span data-testid={`mock-icon-${name}`}>{name}</span>,
}))
jest.mock('@/components/atoms/StatusPill', () => ({
  StatusPill: ({ status }: any) => <span data-testid="mock-status-pill">{status}</span>,
}))
jest.mock('@/components/atoms/Score', () => ({
  ScoreDisplay: ({ score }: any) => <span data-testid="mock-score">{score}</span>,
}))
jest.mock('next/link', () => ({ children, href }: any) => <a href={href} data-testid="mock-link">{children}</a>)
jest.mock('../AddGoalSheet', () => ({ AddGoalSheet: ({ isOpen }: any) => isOpen ? <div data-testid="mock-add-goal-sheet" /> : null }))
jest.mock('../ManageGoalTeamSheet', () => ({ ManageGoalTeamSheet: ({ isOpen }: any) => isOpen ? <div data-testid="mock-manage-team-sheet" /> : null }))

const defaultGoal = {
  id: 'g-1',
  name: 'Test Goal',
  status: 'active',
  instructions: 'Test instructions',
  avgScore: 8.5,
  project: { name: 'Test Project', emoji: '🚀' },
  reports: [
    { id: 'r-1', submissionDate: new Date('2023-01-01').toISOString(), employees: { name: 'Alice' }, managerOverallScore: 9 },
    { id: 'r-2', submissionDate: new Date('2023-01-02').toISOString(), employees: { name: 'Bob' }, managerOverallScore: 8 },
  ],
  goal_members: [
    { employee: { id: 'e-1', full_name: 'Alice Smith' } },
  ],
  criteria: [
    { id: 'c-1', name: 'Quality', weight: 50 },
    { id: 'c-2', name: 'Speed', weight: 50 },
  ],
  deadline: new Date('2023-12-31').toISOString(),
  createdAt: new Date('2023-01-01').toISOString(),
}

describe('GoalDetailView', () => {
  it('renders goal details correctly', () => {
    render(<GoalDetailView goal={defaultGoal} projects={[]} employees={[]} />)

    expect(screen.getAllByText('Test Goal')[0]).toBeInTheDocument()
    expect(screen.getByText('Test instructions')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('renders nothing if goal is null', () => {
    const { container } = render(<GoalDetailView goal={null} projects={[]} employees={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('handles complete goal action', () => {
    window.confirm = jest.fn(() => true)
    render(<GoalDetailView goal={defaultGoal} projects={[]} employees={[]} />)

    const completeButton = screen.getByText('Complete Goal')
    fireEvent.click(completeButton)

    expect(window.confirm).toHaveBeenCalledWith('Mark this goal as completed?')
    // The current state is handled internally so we just ensure confirm is called
  })

  it('opens edit goal sheet', () => {
    render(<GoalDetailView goal={defaultGoal} projects={[]} employees={[]} />)

    expect(screen.queryByTestId('mock-add-goal-sheet')).not.toBeInTheDocument()

    const editButton = screen.getByText('Edit Goal')
    fireEvent.click(editButton)

    expect(screen.getByTestId('mock-add-goal-sheet')).toBeInTheDocument()
  })

  it('opens manage team sheet', () => {
    render(<GoalDetailView goal={defaultGoal} projects={[]} employees={[]} />)

    expect(screen.queryByTestId('mock-manage-team-sheet')).not.toBeInTheDocument()

    const manageButton = screen.getByText('Manage')
    fireEvent.click(manageButton)

    expect(screen.getByTestId('mock-manage-team-sheet')).toBeInTheDocument()
  })

  it('respects readOnly prop', () => {
    render(<GoalDetailView goal={defaultGoal} projects={[]} employees={[]} readOnly={true} />)

    expect(screen.queryByText('Complete Goal')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit Goal')).not.toBeInTheDocument()
    expect(screen.queryByText('Manage')).not.toBeInTheDocument()
  })

  it('renders empty states gracefully', () => {
    const emptyGoal = { ...defaultGoal, reports: undefined, goal_members: undefined, criteria: undefined }
    render(<GoalDetailView goal={emptyGoal} projects={[]} employees={[]} />)

    expect(screen.getByText('No reports yet.')).toBeInTheDocument()
    expect(screen.getByText('No members assigned.')).toBeInTheDocument()
  })
})

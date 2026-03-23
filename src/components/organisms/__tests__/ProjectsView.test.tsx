import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectsView } from '../ProjectsView';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock icon and button components
jest.mock('@/components/atoms/Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

jest.mock('@/components/atoms/Button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>
}));

// Mock molecules
jest.mock('@/components/molecules/ProjectCard', () => ({
  ProjectCard: ({ name, onComplete, onDelete, onEdit }: any) => (
    <div data-testid="project-card">
      {name}
      <button onClick={onComplete}>Complete</button>
      <button onClick={onDelete}>Delete</button>
      <button onClick={onEdit}>Edit</button>
    </div>
  )
}));

jest.mock('@/components/molecules/ProjectRow', () => ({
  ProjectRow: ({ name, onComplete, onDelete, onEdit }: any) => (
    <tr data-testid="project-row">
      <td>{name}</td>
      <td>
        <button onClick={onComplete}>Complete Row</button>
        <button onClick={onDelete}>Delete Row</button>
        <button onClick={onEdit}>Edit Row</button>
      </td>
    </tr>
  )
}));

// Mock sheet
jest.mock('@/components/organisms/AddProjectSheet', () => ({
  AddProjectSheet: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="add-project-sheet">
      <button onClick={onClose}>Close</button>
    </div>
  ) : null
}));

// Mock design system
jest.mock('@/design-system', () => ({
  colors: { bg: '#fff', text: '#000', surface: '#fff', border: '#ccc', danger: 'red', green: 'green' },
  radius: { md: '4px', lg: '8px', xl: '12px', '2xl': '16px' },
  typography: { fonts: { body: 'sans-serif', display: 'sans-serif' } },
  animation: { fast: '0.1s' },
  shadows: { cardHover: 'none' },
  layout: { contentPadding: '16px' }
}));

const mockProjects = [
  {
    id: 'p1',
    name: 'Test Project 1',
    category: 'Engineering',
    status: 'active',
  },
  {
    id: 'p2',
    name: 'Test Project 2',
    category: 'Design',
    status: 'completed',
    emoji: '🎉'
  }
];

jest.mock('@/app/actions/projectActions', () => ({
  upsertProjectAction: jest.fn().mockResolvedValue({ success: true }),
  deleteProjectAction: jest.fn().mockResolvedValue({ success: true }),
  updateProjectStatusAction: jest.fn().mockResolvedValue({ success: true }),
}));

describe('ProjectsView', () => {
  it('renders active and completed projects', () => {
    render(<ProjectsView projects={mockProjects} employees={[]} />);

    // Grid mode is default
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();

    // completed projects accordion
    expect(screen.getByText('Completed Projects (1)')).toBeInTheDocument();
  });

  it('toggles view mode', () => {
    render(<ProjectsView projects={mockProjects} employees={[]} />);

    // Default is grid, we have project cards
    expect(screen.getAllByTestId('project-card').length).toBe(1);

    // Switch to list view
    fireEvent.click(screen.getByTitle('List View'));
    expect(screen.getAllByTestId('project-row').length).toBe(1);

    // Switch back to grid
    fireEvent.click(screen.getByTitle('Grid View'));
    expect(screen.getAllByTestId('project-card').length).toBe(1);
  });

  it('searches projects', () => {
    render(<ProjectsView projects={mockProjects} employees={[]} />);

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });

  it('opens new project sheet', () => {
    render(<ProjectsView projects={mockProjects} employees={[]} />);

    expect(screen.queryByTestId('add-project-sheet')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('New Project'));
    expect(screen.getByTestId('add-project-sheet')).toBeInTheDocument();
  });

  it('handles readOnly mode', () => {
    render(<ProjectsView projects={mockProjects} employees={[]} readOnly={true} />);

    expect(screen.queryByText('New Project')).not.toBeInTheDocument();
  });

  it('handles complete confirmation modal', async () => {
    const { updateProjectStatusAction } = require('@/app/actions/projectActions');

    render(<ProjectsView projects={mockProjects} employees={[]} />);

    // The complete button is in the ProjectCard mock
    // It's the first one, for Test Project 1
    const completeBtns = screen.getAllByText('Complete');
    fireEvent.click(completeBtns[0]);

    // Now modal should be open
    expect(screen.getByText('Complete Project?')).toBeInTheDocument();

    // Click confirm
    fireEvent.click(screen.getByText('Confirm Completion'));

    await waitFor(() => {
      expect(updateProjectStatusAction).toHaveBeenCalledWith('p1', 'completed');
    });
  });

  it('handles delete confirmation modal', async () => {
    const { deleteProjectAction } = require('@/app/actions/projectActions');

    render(<ProjectsView projects={mockProjects} employees={[]} />);

    const deleteBtns = screen.getAllByText('Delete');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Delete Project?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Deletion'));

    await waitFor(() => {
      expect(deleteProjectAction).toHaveBeenCalledWith('p1');
    });
  });
});

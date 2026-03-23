import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { OrganizationView } from '../OrganizationView';

// Mock Next.js navigation hooks
mock.module('next/navigation', () => ({
  useRouter() {
    return {
      push: mock(),
      replace: mock(),
      refresh: mock(),
    };
  },
  useSearchParams() {
    return {
      get: mock().mockReturnValue(null),
    };
  },
}));

// Mock action functions
const mockUpdateOrganizationAction = mock();
const mockCreateCustomMetricAction = mock();
const mockUpdateCustomMetricAction = mock();
const mockDeleteCustomMetricAction = mock();

mock.module('@/app/actions/organizationActions', () => ({
  updateOrganizationAction: mockUpdateOrganizationAction,
  createCustomMetricAction: mockCreateCustomMetricAction,
  updateCustomMetricAction: mockUpdateCustomMetricAction,
  deleteCustomMetricAction: mockDeleteCustomMetricAction,
}));

const mockUpdateEmployeePermissionsAction = mock();
mock.module('@/app/actions/employeeActions', () => ({
  updateEmployeePermissionsAction: mockUpdateEmployeePermissionsAction,
}));

const mockUpdateManagerSettingsAction = mock();
mock.module('@/app/actions/managerSettingsActions', () => ({
  updateManagerSettingsAction: mockUpdateManagerSettingsAction,
}));

// Mock window interactions
window.alert = mock();
window.confirm = mock().mockReturnValue(true);
console.error = mock(); // suppress errors from mock rejections

// Mock sub-components
mock.module('@/components/organisms/ManagePermissionsModal', () => ({
  ManagePermissionsModal: () => <div data-testid="manage-permissions-modal">ManagePermissionsModal</div>
}));

// Mock icon since it can have errors rendering
mock.module('@/components/atoms/Icon', () => ({
  Icon: () => <span data-testid="mock-icon" />
}));

// Provide some default dummy data
const mockOrganization = {
  id: 'org-1',
  name: 'Test Org',
  goalWeight: 75,
  aiConfig: {
    allowLate: true,
    allowLateSubmissions: true,
  },
  selectedMetrics: ['communication', 'delivery'],
};

import { Employee, CustomMetric, Organization } from '@/types';

const mockEmployees: Employee[] = [
  { id: 'emp-1', name: 'John Doe', email: 'john@example.com', role: 'employee', isAccountOwner: false, organizationId: 'org-1' },
  { id: 'emp-2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', isAccountOwner: true, organizationId: 'org-1' },
];

const mockCustomMetrics = [
  { id: 'metric-1', organizationId: 'org-1', name: 'Custom Metric 1', description: 'Desc 1', isActive: true },
];

const mockPermissions = {
  canInviteUsers: true,
  canManageSettings: true,
  isAccountOwner: true,
};

describe('OrganizationView', () => {
  beforeEach(() => {
    // Reset global dom state if needed
    document.body.innerHTML = '';
    mockUpdateOrganizationAction.mockReset();
    mockCreateCustomMetricAction.mockReset();
    mockUpdateCustomMetricAction.mockReset();
    mockDeleteCustomMetricAction.mockReset();
    mockUpdateEmployeePermissionsAction.mockReset();
    mockUpdateManagerSettingsAction.mockReset();
    (window.alert as any).mockReset();
    (window.confirm as any).mockReset().mockReturnValue(true);
    (console.error as any).mockReset();
  });

  it('renders correctly with default general tab', () => {
    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    // Should render navigation tabs
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Metrics')).toBeTruthy();
    expect(screen.getByText('Users')).toBeTruthy();
    expect(screen.getByText('Advanced')).toBeTruthy();

    // Verify content is visible
    expect(screen.getByText('General Information')).toBeTruthy();
    expect(screen.getByText('AI Evaluation Configuration')).toBeTruthy();
    expect(screen.getByText('Reporting')).toBeTruthy();

    // Org Name should be rendered
    expect(screen.getByDisplayValue('Test Org')).toBeTruthy();
  });

  it('navigates to different tabs', () => {
    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    // Click Metrics tab
    const metricsTabs = screen.getAllByText('Metrics');
    fireEvent.click(metricsTabs[0]);
    expect(screen.getByText('Organizational Metrics')).toBeTruthy();
    expect(screen.getByText('Custom Metrics')).toBeTruthy();

    // Click Users tab
    const usersTabs = screen.getAllByText('Users');
    fireEvent.click(usersTabs[0]);
    expect(screen.getByText('Active Members (2)')).toBeTruthy();

    // Click Advanced tab
    const advancedTabs = screen.getAllByText('Advanced');
    fireEvent.click(advancedTabs[0]);
    expect(screen.getByText('Danger Zone')).toBeTruthy();
  });

  it('hides sensitive tabs for users without permissions', () => {
    const limitedPermissions = {
        canInviteUsers: false,
        canManageSettings: false,
        isAccountOwner: false,
    };

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={limitedPermissions}
      />
    );

    // Should NOT render sensitive tabs
    expect(screen.queryByText('General')).toBeNull();
    expect(screen.queryByText('Metrics')).toBeNull();
    expect(screen.queryByText('Advanced')).toBeNull();

    // Should render Users tab and default to it
    expect(screen.getByText('Users')).toBeTruthy();
    expect(screen.getByText('Active Members (2)')).toBeTruthy();
  });

  it('can save general settings', async () => {
    mockUpdateOrganizationAction.mockResolvedValue({ success: true });
    mockUpdateManagerSettingsAction.mockResolvedValue({ success: true });

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    const orgNameInput = screen.getByDisplayValue('Test Org');
    fireEvent.change(orgNameInput, { target: { value: 'New Test Org' } });

    const buttons = screen.getAllByText('Save Changes');
    const saveButton = buttons[0];
    fireEvent.click(saveButton);

    expect(saveButton.textContent).toContain('Saving...');

    await waitFor(() => {
      expect(mockUpdateOrganizationAction).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Test Org',
        goalWeight: 75,
      }));
      expect(mockUpdateManagerSettingsAction).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Settings saved successfully');
    });
  });

  it('handles metric creation', async () => {
    mockCreateCustomMetricAction.mockResolvedValue({ success: true });

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    // Switch to Metrics tab
    const metricsTabs = screen.getAllByText('Metrics');
    fireEvent.click(metricsTabs[0]);

    // Open add metric modal/form
    fireEvent.click(screen.getByText('Add Custom Metric'));

    const nameInput = screen.getByPlaceholderText('Metric Name (e.g. Innovation)');
    const descInput = screen.getByPlaceholderText('Description (Optional)');

    fireEvent.change(nameInput, { target: { value: 'New Metric' } });
    fireEvent.change(descInput, { target: { value: 'New Desc' } });

    const buttons = screen.getAllByRole('button');
    const saveButton = buttons.find(b => b.textContent && b.textContent.includes('Save') && !b.textContent.includes('Metrics'));

    if (saveButton) {
      fireEvent.click(saveButton);
    }

    await waitFor(() => {
      expect(mockCreateCustomMetricAction).toHaveBeenCalledWith({
        name: 'New Metric',
        description: 'New Desc',
        isActive: true
      });
    });
  });

  it('handles custom metric deletion', async () => {
    mockDeleteCustomMetricAction.mockResolvedValue({ success: true });

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    const metricsTabs = screen.getAllByText('Metrics');
    fireEvent.click(metricsTabs[0]);

    // Find the delete button for the first custom metric
    // In our mock, it's just an icon but we can find it by title
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this custom metric?');
      expect(mockDeleteCustomMetricAction).toHaveBeenCalledWith('metric-1');
    });
  });

  it('handles custom metric toggle', async () => {
    mockUpdateCustomMetricAction.mockResolvedValue({ success: true });

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    const metricsTabs = screen.getAllByText('Metrics');
    fireEvent.click(metricsTabs[0]);

    const toggleButton = screen.getByTitle('Deactivate');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockUpdateCustomMetricAction).toHaveBeenCalledWith('metric-1', { isActive: false });
    });
  });

  it('handles metric save errors gracefully', async () => {
    mockUpdateOrganizationAction.mockRejectedValue(new Error('Network error'));

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    const metricsTabs = screen.getAllByText('Metrics');
    fireEvent.click(metricsTabs[0]); // Click the navigation tab

    const buttons = screen.getAllByText('Save Metrics');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  it('handles general settings save errors gracefully', async () => {
    mockUpdateOrganizationAction.mockRejectedValue(new Error('Failed setting update'));

    render(
      <OrganizationView
        organization={mockOrganization as any}
        employees={mockEmployees}
        customMetrics={mockCustomMetrics}
        currentUserPermissions={mockPermissions}
      />
    );

    const buttons = screen.getAllByText('Save Changes');
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to save settings: Failed setting update');
    });
  });
});

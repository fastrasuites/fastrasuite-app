import { render, screen } from '@testing-library/react';
import { PermissionGuard } from '../PermissionGuard';
import { usePermission } from '../../../hooks/usePermission';

// Mock the hook
jest.mock('../../../hooks/usePermission');

const mockedUsePermission = usePermission as jest.MockedFunction<typeof usePermission>;

describe('PermissionGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when the user has the required entitlement', () => {
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(true),
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PermissionGuard module="project_costing" entitlement="submit_project">
        <button>Protected Button</button>
      </PermissionGuard>
    );

    expect(screen.getByRole('button', { name: 'Protected Button' })).toBeInTheDocument();
  });

  it('hides children when the user lacks the required entitlement', () => {
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PermissionGuard module="project_costing" entitlement="submit_project">
        <button>Protected Button</button>
      </PermissionGuard>
    );

    expect(screen.queryByRole('button', { name: 'Protected Button' })).not.toBeInTheDocument();
  });

  it('renders the custom fallback when provided and access is denied', () => {
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PermissionGuard 
        module="project_costing" 
        entitlement="submit_project"
        fallback={<button disabled>Disabled Button</button>}
      >
        <button>Protected Button</button>
      </PermissionGuard>
    );

    expect(screen.queryByRole('button', { name: 'Protected Button' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled Button' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled Button' })).toBeDisabled();
  });

  it('renders children when access is denied but user is an admin', () => {
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(false), // would normally be blocked
      isAdmin: true, // admin bypass
      isLoading: false,
    });

    render(
      <PermissionGuard module="project_costing" entitlement="submit_project">
        <button>Protected Button</button>
      </PermissionGuard>
    );

    expect(screen.getByRole('button', { name: 'Protected Button' })).toBeInTheDocument();
  });

  it('renders nothing while permissions are loading', () => {
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(true),
      isAdmin: true,
      isLoading: true, // currently loading
    });

    const { container } = render(
      <PermissionGuard module="project_costing" entitlement="submit_project">
        <button>Protected Button</button>
      </PermissionGuard>
    );

    // Should return null
    expect(container.firstChild).toBeNull();
  });

  describe('project_request specific tests', () => {
    it('renders project_request submit button when user has create entitlement', () => {
      mockedUsePermission.mockReturnValue({
        can: jest.fn().mockImplementation((params) => {
          return params.module === 'project_request' && params.entitlement === 'create';
        }),
        isAdmin: false,
        isLoading: false,
      });

      render(
        <PermissionGuard module="project_request" entitlement="create">
          <button>Submit request</button>
        </PermissionGuard>
      );

      expect(screen.getByRole('button', { name: 'Submit request' })).toBeInTheDocument();
    });

    it('hides project_request submit button when user lacks create entitlement', () => {
      mockedUsePermission.mockReturnValue({
        can: jest.fn().mockImplementation((params) => {
          // User has view but not create
          return params.module === 'project_request' && params.entitlement === 'view';
        }),
        isAdmin: false,
        isLoading: false,
      });

      render(
        <PermissionGuard module="project_request" entitlement="create">
          <button>Submit request</button>
        </PermissionGuard>
      );

      expect(screen.queryByRole('button', { name: 'Submit request' })).not.toBeInTheDocument();
    });
  });
});

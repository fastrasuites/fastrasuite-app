import { render, screen } from '@testing-library/react';
import { PageGuard } from '../PageGuard';
import { usePermission } from '../../../hooks/usePermission';
import { useSelector } from 'react-redux';

// Mock the hooks
jest.mock('../../../hooks/usePermission');
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../shared/UnauthorizedMessage', () => ({
  UnauthorizedMessage: () => <div data-testid="unauthorized-message">Access Denied</div>,
}));

const mockedUsePermission = usePermission as jest.MockedFunction<typeof usePermission>;
const mockedUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('PageGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders LoadingDots when user is not authenticated yet (null)', () => {
    mockedUseSelector.mockReturnValue(null); // No user yet
    mockedUsePermission.mockReturnValue({
      can: jest.fn(),
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PageGuard module="project_costing" entitlement="view_project">
        <div>Protected Page Content</div>
      </PageGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page Content')).not.toBeInTheDocument();
  });

  it('renders LoadingDots when permissions are still loading', () => {
    mockedUseSelector.mockReturnValue({ id: 1, name: 'Test User' }); // User exists
    mockedUsePermission.mockReturnValue({
      can: jest.fn(),
      isAdmin: false,
      isLoading: true, // Permissions loading
    });

    render(
      <PageGuard module="project_costing" entitlement="view_project">
        <div>Protected Page Content</div>
      </PageGuard>
    );

    expect(screen.getByText('Verifying access rights...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page Content')).not.toBeInTheDocument();
  });

  it('renders children immediately if user is an admin, bypassing can()', () => {
    mockedUseSelector.mockReturnValue({ id: 1, name: 'Admin User' });
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(false), // Normally would fail
      isAdmin: true, // But is admin
      isLoading: false,
    });

    render(
      <PageGuard module="project_costing" entitlement="view_project">
        <div>Protected Page Content</div>
      </PageGuard>
    );

    expect(screen.getByText('Protected Page Content')).toBeInTheDocument();
  });

  it('renders children when user is loaded and has the required entitlement', () => {
    mockedUseSelector.mockReturnValue({ id: 1, name: 'Test User' });
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(true), // Has access
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PageGuard module="project_costing" entitlement="view_project">
        <div>Protected Page Content</div>
      </PageGuard>
    );

    expect(screen.getByText('Protected Page Content')).toBeInTheDocument();
  });

  it('renders UnauthorizedMessage when user is loaded but lacks the entitlement', () => {
    mockedUseSelector.mockReturnValue({ id: 1, name: 'Test User' });
    mockedUsePermission.mockReturnValue({
      can: jest.fn().mockReturnValue(false), // No access
      isAdmin: false,
      isLoading: false,
    });

    render(
      <PageGuard module="project_costing" entitlement="view_project">
        <div>Protected Page Content</div>
      </PageGuard>
    );

    expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
    expect(screen.queryByText('Protected Page Content')).not.toBeInTheDocument();
  });

  describe('project_request specific tests', () => {
    it('renders project_request page when user has view entitlement', () => {
      mockedUseSelector.mockReturnValue({ id: 1, name: 'Test User' });
      mockedUsePermission.mockReturnValue({
        can: jest.fn().mockImplementation((params) => {
          return params.module === 'project_request' && params.entitlement === 'view';
        }),
        isAdmin: false,
        isLoading: false,
      });

      render(
        <PageGuard module="project_request" entitlement="view">
          <div>Dashboard Content</div>
        </PageGuard>
      );

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    it('blocks project_request page when user lacks view entitlement', () => {
      mockedUseSelector.mockReturnValue({ id: 1, name: 'Test User' });
      mockedUsePermission.mockReturnValue({
        can: jest.fn().mockReturnValue(false),
        isAdmin: false,
        isLoading: false,
      });

      render(
        <PageGuard module="project_request" entitlement="view">
          <div>Dashboard Content</div>
        </PageGuard>
      );

      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
      expect(screen.getByTestId('unauthorized-message')).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';
import PettyCashRequestPage from '../petty-cash-request/page';
import { useGetPettyCashRequestsQuery } from '@/api/requests/pettyCashRequestApi';
import { useGetProjectCostingProjectsQuery } from '@/api/projectCostingApi';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/project-request/petty-cash-request'),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/shared/TopBar/reusableTopBar', () => ({
  NavBar: () => <div data-testid="navbar">NavBar</div>,
}));

jest.mock('@/api/requests/pettyCashRequestApi', () => ({
  useGetPettyCashRequestsQuery: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectsQuery: jest.fn(),
}));

jest.mock('@/hooks/usePermission', () => ({
  usePermission: jest.fn(),
}));

describe('PettyCashRequestPage Integration', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useGetProjectCostingProjectsQuery as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Project Beta' }],
    });
    (useGetPettyCashRequestsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          reference_id: 'PC001',
          project_details: { name: 'Project Beta' },
          status: 'draft',
          amount_requested: 500,
          reason: 'Office supplies',
        },
      ],
      isLoading: false,
    });
  });

  it('renders the dashboard with New Request button if user has create entitlement', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockImplementation((params) => {
        return params.module === 'project_request' && params.entitlement === 'create';
      }),
      isAdmin: false,
      isLoading: false,
    });

    render(<PettyCashRequestPage />);

    expect(screen.getByText('Petty Cash Request')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Petty Cash Request/i })).toBeInTheDocument();
  });

  it('hides the New Request button if user lacks create entitlement', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(<PettyCashRequestPage />);

    expect(screen.getByText('Petty Cash Request')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New Petty Cash Request/i })).not.toBeInTheDocument();
  });
});

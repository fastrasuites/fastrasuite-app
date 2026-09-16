import { render, screen } from '@testing-library/react';
import LabourRequestPage from '../labour-request/page';
import { useGetLabourRequestsQuery } from '@/api/requests/labourRequestApi';
import { useGetProjectCostingProjectsQuery } from '@/api/projectCostingApi';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/project-request/labour-request'),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/shared/TopBar/reusableTopBar', () => ({
  NavBar: () => <div data-testid="navbar">NavBar</div>,
}));

jest.mock('@/api/requests/labourRequestApi', () => ({
  useGetLabourRequestsQuery: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectsQuery: jest.fn(),
}));

jest.mock('@/hooks/usePermission', () => ({
  usePermission: jest.fn(),
}));

describe('LabourRequestPage Integration', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useGetProjectCostingProjectsQuery as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Project A' }],
    });
    (useGetLabourRequestsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          reference_id: 'LR001',
          project: 1,
          status: 'draft',
          detail: { number_of_workers: 5, role_type: 'Mason', created_by_name: 'John Doe' },
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

    render(<LabourRequestPage />);

    expect(screen.getByText('Labour Request')).toBeInTheDocument();
    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Mason')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Labour Request/i })).toBeInTheDocument();
  });

  it('hides the New Request button if user lacks create entitlement', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(<LabourRequestPage />);

    expect(screen.getByText('Labour Request')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New Labour Request/i })).not.toBeInTheDocument();
  });
});

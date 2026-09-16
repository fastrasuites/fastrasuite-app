import { render, screen } from '@testing-library/react';
import SubcontractorRequestPage from '../subcontractor-request/page';
import { useGetSubcontractorRequestsQuery } from '@/api/subcontractorRequestApi';
import { useGetProjectCostingProjectsQuery } from '@/api/projectCostingApi';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/project-request/subcontractor-request'),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/shared/TopBar/reusableTopBar', () => ({
  NavBar: () => <div data-testid="navbar">NavBar</div>,
}));

jest.mock('@/api/subcontractorRequestApi', () => ({
  useGetSubcontractorRequestsQuery: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectsQuery: jest.fn(),
}));

jest.mock('@/hooks/usePermission', () => ({
  usePermission: jest.fn(),
}));

describe('SubcontractorRequestPage Integration', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useGetProjectCostingProjectsQuery as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Project Gamma' }],
    });
    (useGetSubcontractorRequestsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          reference_id: 'SC001',
          project_details: { name: 'Project Gamma' },
          status: 'draft',
          sub_contractor_name: 'BuildIt Corp',
          description: 'Concrete works',
          amount_requested: '1000.00',
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

    render(<SubcontractorRequestPage />);

    expect(screen.getByText('Subcontractor Request')).toBeInTheDocument();
    expect(screen.getByText('Subcontractor Request')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Subcontractor Request/i })).toBeInTheDocument();
  });

  it('hides the New Request button if user lacks create entitlement', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(<SubcontractorRequestPage />);

    expect(screen.getByText('Subcontractor Request')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New Subcontractor Request/i })).not.toBeInTheDocument();
  });

  it('renders reference_id with format SUB0001 even when project_request.reference_id is present', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockReturnValue(true),
      isAdmin: false,
      isLoading: false,
    });
    (useGetSubcontractorRequestsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          reference_id: 'SUB0001',
          project_request: {
            id: 1,
            reference_id: 'PjR-2026-001',
            status: 'pending',
          },
          project_details: { name: 'Lekki Branch Head Quaters' },
          status: 'pending',
          sub_contractor_name: 'BuildIt Corp',
          scope_of_work: 'Concrete works',
          contract_value: '1000.00',
        },
      ],
      isLoading: false,
    });

    render(<SubcontractorRequestPage />);

    expect(screen.getByText('SUB0001')).toBeInTheDocument();
    expect(screen.queryByText('PjR-2026-001')).not.toBeInTheDocument();
  });
});

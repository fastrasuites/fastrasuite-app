import { render, screen } from '@testing-library/react';
import MaterialConsumptionPage from '../material-consumption-request/page';
import { useGetMaterialConsumptionsQuery } from '@/api/requests/materialConsumptionRequestApi';
import { useGetProjectCostingProjectsQuery } from '@/api/projectCostingApi';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/project-request/material-consumption-request'),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/shared/TopBar/reusableTopBar', () => ({
  NavBar: () => <div data-testid="navbar">NavBar</div>,
}));

jest.mock('@/api/requests/materialConsumptionRequestApi', () => ({
  useGetMaterialConsumptionsQuery: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectsQuery: jest.fn(),
}));

jest.mock('@/hooks/usePermission', () => ({
  usePermission: jest.fn(),
}));

describe('MaterialConsumptionPage Integration', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useGetProjectCostingProjectsQuery as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: 'Project Delta' }],
    });
    (useGetMaterialConsumptionsQuery as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          reference_id: 'MC001',
          project_details: { name: 'Project Delta' },
          status: 'draft',
          items: [],
          total_cost: 0,
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

    render(<MaterialConsumptionPage />);

    expect(screen.getByText('Material Consumption Request')).toBeInTheDocument();
    expect(screen.getByText('Material Consumption Request')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Material Consumption Request/i })).toBeInTheDocument();
  });

  it('hides the New Request button if user lacks create entitlement', () => {
    (usePermission as jest.Mock).mockReturnValue({
      can: jest.fn().mockReturnValue(false),
      isAdmin: false,
      isLoading: false,
    });

    render(<MaterialConsumptionPage />);

    expect(screen.getByText('Material Consumption Request')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New Material Consumption Request/i })).not.toBeInTheDocument();
  });
});

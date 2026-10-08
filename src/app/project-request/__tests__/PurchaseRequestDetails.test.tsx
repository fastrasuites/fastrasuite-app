import React from 'react';
import { render, screen } from '@testing-library/react';
import PurchaseRequestDetailPage from '../purchase-request/[id]/page';
import {
  useGetProjectPurchaseRequestQuery,
  useDeleteProjectPurchaseRequestMutation,
  usePatchProjectPurchaseRequestMutation,
  useSubmitProjectPurchaseRequestMutation,
} from '@/api/requests/projectPurchaseRequestApi';
import { useGetProjectCostingProjectQuery } from '@/api/projectCostingApi';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { useRouter, useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/api/requests/projectPurchaseRequestApi', () => ({
  ...jest.requireActual('@/api/requests/projectPurchaseRequestApi'),
  useGetProjectPurchaseRequestQuery: jest.fn(),
  useDeleteProjectPurchaseRequestMutation: jest.fn(),
  usePatchProjectPurchaseRequestMutation: jest.fn(),
  useSubmitProjectPurchaseRequestMutation: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  ...jest.requireActual('@/api/projectCostingApi'),
  useGetProjectCostingProjectQuery: jest.fn(),
}));

jest.mock('@/hooks/useModulePermissions', () => ({
  useModulePermissions: jest.fn(),
}));

jest.mock('@/components/auth/PageGuard', () => ({
  PageGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PurchaseRequestDetailPage', () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockDeleteMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  const mockPatchMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  const mockSubmitMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });

  const mockApiResponse = {
    id: 10,
    reference_id: 'PR0010',
    project_request: {
      id: 25,
      reference_id: 'PjR-2026-025',
      request_type: 'purchase_request',
      status: 'draft',
    },
    project_details: {
      id: 1,
      name: 'Lekki Branch Head Quaters',
    },
    phase_details: {
      name: 'Phase 1: Foundation',
    },
    activity_details: {
      name: 'Excavation',
    },
    lines: [
      {
        id: 1,
        product_name: 'Cement',
        quantity: 50,
        estimated_unit_cost: 5000,
        line_total: 250000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '10' });
    (useModulePermissions as jest.Mock).mockReturnValue({
      canDo: jest.fn().mockReturnValue(true),
    });
    (useDeleteProjectPurchaseRequestMutation as jest.Mock).mockReturnValue([
      mockDeleteMutation,
      { isLoading: false },
    ]);
    (usePatchProjectPurchaseRequestMutation as jest.Mock).mockReturnValue([
      mockPatchMutation,
      { isLoading: false },
    ]);
    (useSubmitProjectPurchaseRequestMutation as jest.Mock).mockReturnValue([
      mockSubmitMutation,
      { isLoading: false },
    ]);
    (useGetProjectPurchaseRequestQuery as jest.Mock).mockReturnValue({
      data: mockApiResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useGetProjectCostingProjectQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders Request ID from reference_id with format PR0010 even when project_request.reference_id is present', () => {
    render(<PurchaseRequestDetailPage />);

    expect(screen.getByText('PR0010')).toBeInTheDocument();
    expect(screen.queryByText('PjR-2026-025')).not.toBeInTheDocument();
  });

  it('falls back to PR0010 when reference_id is missing and id is 10', () => {
    (useGetProjectPurchaseRequestQuery as jest.Mock).mockReturnValue({
      data: {
        ...mockApiResponse,
        reference_id: undefined,
        project_request: undefined,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PurchaseRequestDetailPage />);

    expect(screen.getByText('PR0010')).toBeInTheDocument();
  });
});

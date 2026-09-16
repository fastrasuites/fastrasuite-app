import React from 'react';
import { render, screen } from '@testing-library/react';
import PlantEquipmentRequestDetailPage from '../plant-equipment-request/[id]/page';
import {
  useGetPlantEquipmentRequestQuery,
  useDeletePlantEquipmentRequestMutation,
  useSubmitPlantEquipmentRequestMutation,
} from '@/api/requests/plantEquipmentRequestApi';
import {
  useGetProjectCostingProjectsQuery,
  useGetProjectCostingProjectQuery,
} from '@/api/projectCostingApi';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { useRouter, useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/api/requests/plantEquipmentRequestApi', () => ({
  useGetPlantEquipmentRequestQuery: jest.fn(),
  useDeletePlantEquipmentRequestMutation: jest.fn(),
  useSubmitPlantEquipmentRequestMutation: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectsQuery: jest.fn(),
  useGetProjectCostingProjectQuery: jest.fn(),
}));

jest.mock('@/hooks/useModulePermissions', () => ({
  useModulePermissions: jest.fn(),
}));

jest.mock('@/components/auth/PageGuard', () => ({
  PageGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PlantEquipmentRequestDetailPage', () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockDeleteMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  const mockSubmitMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });

  const mockApiResponse = {
    id: 1,
    project_request: {
      id: 10,
      reference_id: "PjR-2026-010",
      request_type: "plant_equipment",
      status: "draft",
      request_amount: 9000.0,
    },
    project_request_id: 10,
    project_details: {
      id: 1,
      name: "Lekki Branch Head Quaters",
      project_code: "PC-2026-001",
    },
    phase_details: {
      id: "37e9dae2-ad5d-4406-bb96-321923cc1dcb",
      name: "Phase 2: Site Preparation & Earthworks",
      code: "PHASE-02",
    },
    activity_details: {
      id: "4c079af3-a4d8-4980-85ed-0f4921f58d08",
      name: "Bulk Excavation & Cut-to-Fill",
      serial_number: 3,
    },
    equipment_name: "frames",
    description: "001",
    quantity: 89,
    required_date: "2026-09-14",
    estimated_cost: "9000.00",
    justification_notes: "holl",
    payment_type: "purchase",
    expected_return_date: null,
    available_budget: "8990000.00",
    created_by_id: 1,
    created_by_name: "admin_noblestack_ltd",
    reference_id: "PE0001",
    created_at: "2026-09-14T11:23:56.532654+01:00",
    updated_at: "2026-09-14T11:23:56.532665+01:00",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: "1" });
    (useModulePermissions as jest.Mock).mockReturnValue({
      canDo: jest.fn().mockReturnValue(true),
    });
    (useDeletePlantEquipmentRequestMutation as jest.Mock).mockReturnValue([
      mockDeleteMutation,
      { isLoading: false },
    ]);
    (useSubmitPlantEquipmentRequestMutation as jest.Mock).mockReturnValue([
      mockSubmitMutation,
      { isLoading: false },
    ]);
    (useGetPlantEquipmentRequestQuery as jest.Mock).mockReturnValue({
      data: mockApiResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useGetProjectCostingProjectsQuery as jest.Mock).mockReturnValue({
      data: [{ id: 1, name: "Lekki Branch Head Quaters" }],
      isLoading: false,
    });
    (useGetProjectCostingProjectQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders Request ID from reference_id with format PE0001', () => {
    render(<PlantEquipmentRequestDetailPage />);

    expect(screen.getByText('PE0001')).toBeInTheDocument();
    expect(screen.queryByText('PjR-2026-010')).not.toBeInTheDocument();
  });

  it('renders basic equipment details correctly', () => {
    render(<PlantEquipmentRequestDetailPage />);

    expect(screen.getByText('frames')).toBeInTheDocument();
    expect(screen.getByText('Lekki Branch Head Quaters')).toBeInTheDocument();
    expect(screen.getByText('admin_noblestack_ltd')).toBeInTheDocument();
  });
});

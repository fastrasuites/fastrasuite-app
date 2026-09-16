import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubcontractorRequestDetailsPage from '../subcontractor-request/[id]/page';
import {
  useGetSubcontractorRequestQuery,
  useDeleteSubcontractorRequestMutation,
  useSubmitSubcontractorRequestMutation,
} from '@/api/subcontractorRequestApi';
import { useGetVendorByIdQuery, useGetActiveVendorsQuery } from '@/api/invoice/vendorsApi';
import { useGetProjectCostingProjectQuery } from '@/api/projectCostingApi';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { useRouter, useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/api/subcontractorRequestApi', () => ({
  useGetSubcontractorRequestQuery: jest.fn(),
  useDeleteSubcontractorRequestMutation: jest.fn(),
  useSubmitSubcontractorRequestMutation: jest.fn(),
}));

jest.mock('@/api/invoice/vendorsApi', () => ({
  useGetVendorByIdQuery: jest.fn(),
  useGetActiveVendorsQuery: jest.fn(),
}));

jest.mock('@/api/projectCostingApi', () => ({
  useGetProjectCostingProjectQuery: jest.fn(),
}));

jest.mock('@/hooks/useModulePermissions', () => ({
  useModulePermissions: jest.fn(),
}));

jest.mock('@/components/auth/PageGuard', () => ({
  PageGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SubcontractorRequestDetailsPage', () => {
  const mockRouter = { push: jest.fn(), back: jest.fn() };
  const mockDeleteMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });
  const mockSubmitMutation = jest.fn().mockReturnValue({ unwrap: jest.fn().mockResolvedValue({}) });

  const mockApiResponse = {
    id: 1,
    available_budget: "47500000.00",
    project_request: {
      id: 1,
      reference_id: "PjR-2026-001",
      request_type: "subcontractor",
      status: "draft",
      request_amount: 1000.0,
      created_by_details: {
        first_name: "John",
        last_name: "Doe",
      },
    },
    project_details: {
      id: 1,
      name: "Lekki Branch Head Quaters",
      project_code: "PC-2026-001",
    },
    activity_details: {
      id: "6ffd9e54-ffe2-4a81-8a92-1052efb53a53",
      name: "Roof Truss Fabrication & Installation",
      serial_number: 3,
    },
    phase_details: {
      id: "b664dbbc-ddf1-469f-b08f-d9d3f361fa0f",
      name: "Phase 4: Superstructure & Framing",
      code: "PHASE-04",
    },
    milestones: [],
    reference_id: "SUB0001",
    vendor_name: "",
    vendor_email: null,
    vendor_phone: null,
    scope_of_work: "To work for 100 day",
    payment_type: "lump_sum",
    contract_value: "1000.00",
    payment_terms: "Would pay soon",
    start_date: "2026-09-08",
    end_date: "2026-09-30",
    justification_notes: "Helllo World",
    created_at: "2026-09-08T17:05:39.364309+01:00",
    vendor: 1,
  };

  const mockVendorData = {
    id: 1,
    vendor_name: "Lekki Roofing Experts Ltd",
    email: "contact@lekkiroofing.com",
    phone_number: "+2348012345678",
    contact_name: "Adebayo Salami",
    address: "12 Admiralty Way, Lekki Phase 1, Lagos",
    vendor_code: "VND-001",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: "1" });
    (useModulePermissions as jest.Mock).mockReturnValue({
      canDo: jest.fn().mockReturnValue(true),
    });
    (useDeleteSubcontractorRequestMutation as jest.Mock).mockReturnValue([
      mockDeleteMutation,
      { isLoading: false },
    ]);
    (useSubmitSubcontractorRequestMutation as jest.Mock).mockReturnValue([
      mockSubmitMutation,
      { isLoading: false },
    ]);
    (useGetSubcontractorRequestQuery as jest.Mock).mockReturnValue({
      data: mockApiResponse,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useGetVendorByIdQuery as jest.Mock).mockReturnValue({
      data: mockVendorData,
      isLoading: false,
    });
    (useGetActiveVendorsQuery as jest.Mock).mockReturnValue({
      data: [mockVendorData],
      isLoading: false,
    });
    (useGetProjectCostingProjectQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders status as Draft instead of Approved', () => {
    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('renders Reference ID from reference_id with format SUB0001', () => {
    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getByText('SUB0001')).toBeInTheDocument();
  });

  it('renders Available Budget directly from available_budget response', () => {
    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getByText(/47,500,000\.00/)).toBeInTheDocument();
  });

  it('renders resolved Vendor Details instead of empty strings', () => {
    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getAllByText('Lekki Roofing Experts Ltd').length).toBeGreaterThan(0);
    expect(screen.getByText('contact@lekkiroofing.com')).toBeInTheDocument();
    expect(screen.getByText('+2348012345678')).toBeInTheDocument();
    expect(screen.getByText('Adebayo Salami')).toBeInTheDocument();
  });

  it('renders Edit, Delete, and Submit for approval buttons for draft requests', () => {
    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit for approval/i })).toBeInTheDocument();
  });

  it('navigates to edit page when Edit button is clicked', () => {
    render(<SubcontractorRequestDetailsPage />);

    const editBtn = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(mockRouter.push).toHaveBeenCalledWith('/project-request/subcontractor-request/edit/1');
  });

  it('calls submitRequest with correct ID when Submit for approval is clicked', async () => {
    render(<SubcontractorRequestDetailsPage />);

    const submitBtn = screen.getByRole('button', { name: /Submit for approval/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmitMutation).toHaveBeenCalledWith({
        id: 1,
        subcontractorRequestId: 1,
      });
    });
  });

  it('hides edit and submit buttons when request status is approved', () => {
    (useGetSubcontractorRequestQuery as jest.Mock).mockReturnValue({
      data: {
        ...mockApiResponse,
        project_request: {
          ...mockApiResponse.project_request,
          status: "approved",
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SubcontractorRequestDetailsPage />);

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit for approval/i })).not.toBeInTheDocument();
  });
});

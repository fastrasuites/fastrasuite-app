"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store/store";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { usePermission } from "@/hooks/usePermission";
import { PageGuard } from "@/components/auth/PageGuard";
import { BreadcrumbItem } from "@/components/shared/types";
import { StatusModal } from "@/components/shared/StatusModal";
import {
  useGetUnitOfMeasuresQuery,
  useDeleteUnitOfMeasureMutation,
  usePatchUnitOfMeasureMutation,
  useCreateUnitOfMeasureMutation,
  type UnitOfMeasure,
  type CreateUnitOfMeasureRequest,
} from "@/api/purchase/unitOfMeasureApi";
import {
  formatErrorMessage,
  parseApiError,
  type ApiError,
  validateUnitOfMeasureDuplicates,
} from "@/lib/utils/error-handling";
import {
  unitOfMeasureSchema,
  type UnitOfMeasureInput,
} from "@/lib/validations/currency-validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UnitOfMeasureHeader } from "./components/UnitOfMeasureHeader";
import { UnitOfMeasureTable } from "./components/UnitOfMeasureTable";
import { CreateUnitModal } from "./components/CreateUnitModal";

interface EditingUnit {
  id: number;
  unit_name: string;
  unit_symbol: string;
  unit_category: string;
}

export default function UnitOfMeasurePage() {
  const router = useRouter();
  const { can } = usePermission();
  const user = useSelector((state: RootState) => state.auth.user);

  // Helper function to extract ID from URL
  const getUnitId = (url: string): number => {
    return parseInt(url.split("/").filter(Boolean).pop() || "0");
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // UI state for editing and modal
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingUnit, setEditingUnit] = useState<EditingUnit | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    description: "",
    status: "success",
  });

  // API hooks
  const {
    data: units = [],
    isLoading,
    error,
    refetch,
  } = useGetUnitOfMeasuresQuery({});
  const queryLoading = isLoading as boolean;
  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteUnitOfMeasureMutation();
  const [patchUnit, { isLoading: isUpdating }] =
    usePatchUnitOfMeasureMutation();
  const [createUnit, { isLoading: isCreating }] =
    useCreateUnitOfMeasureMutation();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isValid: isCreateValid },
  } = useForm<UnitOfMeasureInput>({
    resolver: zodResolver(unitOfMeasureSchema),
    mode: "onChange",
    defaultValues: {
      unit_name: "",
      unit_symbol: "",
      unit_category: "",
    },
  });

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = Array.from(new Set(units.map((unit) => unit.unit_category)));
    return cats.sort();
  }, [units]);

  // Filter and search units
  const filteredUnits = useMemo(() => {
    let filtered = units;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (unit) =>
          unit.unit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.unit_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.unit_category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (unit) => unit.unit_category === categoryFilter,
      );
    }

    return filtered;
  }, [units, searchTerm, categoryFilter]);

  // Paginate filtered results
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUnits.slice(startIndex, startIndex + pageSize);
  }, [filteredUnits, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUnits.length / pageSize);

  // Breadcrumbs
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Purchase", href: "/purchase" },
    { label: "Configurations", href: "/purchase/configurations" },
    {
      label: "Unit of Measure",
      href: "/purchase/configurations/unit_of_measure",
      current: true,
    },
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Handle edit start
  const handleEdit = (unit: UnitOfMeasure) => {
    const unitId = getUnitId(unit.url);
    setEditingId(unitId);
    setEditingUnit({
      id: unitId,
      unit_name: unit.unit_name,
      unit_symbol: unit.unit_symbol,
      unit_category: unit.unit_category,
    });
    setServerErrors({});
  };

  // Handle edit cancel
  const handleCancel = () => {
    setEditingId(null);
    setEditingUnit(null);
    setServerErrors({});
  };

  // Handle unit update
  const handleSave = async (id: number) => {
    if (!editingUnit) return;

    // Basic validation
    if (
      !editingUnit.unit_name.trim() ||
      !editingUnit.unit_symbol.trim() ||
      !editingUnit.unit_category.trim()
    ) {
      setServerErrors({
        general:
          "All fields are required. Please fill in unit name, symbol, and category.",
      });
      return;
    }

    try {
      setServerErrors({});

      // Validate for duplicates
      const validation = validateUnitOfMeasureDuplicates(
        {
          name: editingUnit.unit_name.trim(),
          symbol: editingUnit.unit_symbol.trim(),
          category: editingUnit.unit_category.trim(),
        },
        units.filter((u) => getUnitId(u.url) !== id),
      );

      if (!validation.isValid) {
        setServerErrors({ ...validation.errors });
        return;
      }

      // Update unit via API
      await patchUnit({
        id,
        data: {
          unit_name: editingUnit.unit_name.trim(),
          unit_symbol: editingUnit.unit_symbol.trim(),
          unit_category: editingUnit.unit_category.trim(),
        },
      }).unwrap();

      // Success - close editing mode
      setEditingId(null);
      setEditingUnit(null);

      // Show success modal
      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Unit of measure updated successfully!",
        status: "success",
      });
    } catch (error: unknown) {
      console.log(error);
      // Handle API errors
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as {
          status: number;
          data?: Record<string, unknown> | undefined;
        };
        if (apiError.status === 400 || apiError.status === 409) {
          const parsedErrors = parseApiError(apiError);
          setServerErrors({ ...parsedErrors });
        } else {
          setServerErrors({
            general: formatErrorMessage(apiError as ApiError),
          });
        }
      } else {
        setServerErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  // Handle unit deletion
  const handleDelete = async (unit: UnitOfMeasure) => {
    const unitId = getUnitId(unit.url);

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${unit.unit_name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteUnit(unitId).unwrap();

      // Show success modal
      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Unit of measure deleted successfully!",
        status: "success",
      });
    } catch (error: unknown) {
      setStatusModal({
        isOpen: true,
        title: "Error",
        description: formatErrorMessage(error as ApiError),
        status: "error",
      });
    }
  };

  // Handle create unit
  const onCreateSubmit = async (data: UnitOfMeasureInput) => {
    setServerErrors({});

    try {
      // Validate for duplicates
      const validation = validateUnitOfMeasureDuplicates(
        {
          name: data.unit_name,
          symbol: data.unit_symbol,
          category: data.unit_category,
        },
        units,
      );

      if (!validation.isValid) {
        setServerErrors({ ...validation.errors });
        return;
      }

      await createUnit(data as CreateUnitOfMeasureRequest).unwrap();

      // Success - reset form and close modal
      resetCreate();
      setShowCreateForm(false);

      setStatusModal({
        isOpen: true,
        title: "Success!",
        description: "Unit of measure created successfully!",
        status: "success",
      });
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error) {
        const apiError = error as {
          status: number;
          data?: Record<string, unknown> | undefined;
        };
        if (apiError.status === 400 || apiError.status === 409) {
          const parsedErrors = parseApiError(apiError);
          setServerErrors({ ...parsedErrors });
        } else {
          setServerErrors({
            general: formatErrorMessage(apiError as ApiError),
          });
        }
      } else {
        setServerErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const hasCreateAccess = can({
    application: "purchase",
    module: "unitofmeasure",
    action: "create",
  });
  const hasEditAccess = can({
    application: "purchase",
    module: "unitofmeasure",
    action: "edit",
  });
  const hasDeleteAccess = can({
    application: "purchase",
    module: "unitofmeasure",
    action: "delete",
  });

  return (
    <PageGuard application="purchase" module="unitofmeasure">
      <div className="min-h-screen mr-4">
        <UnitOfMeasureHeader
          breadcrumbItems={items}
          onBack={() => router.back()}
          onAddUnit={hasCreateAccess ? () => setShowCreateForm(true) : undefined}
        />

        <UnitOfMeasureTable
          isLoading={queryLoading}
          error={error}
          refetch={refetch}
          paginatedUnits={paginatedUnits}
          editingId={editingId}
          editingUnit={editingUnit}
          setEditingUnit={setEditingUnit}
          serverErrors={serverErrors}
          handleEdit={hasEditAccess ? handleEdit : undefined}
          handleCancel={handleCancel}
          handleSave={hasEditAccess ? handleSave : undefined}
          handleDelete={hasDeleteAccess ? handleDelete : undefined}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          formatDate={formatDate}
          getUnitId={getUnitId}
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
          pageSize={pageSize}
          filteredUnitsLength={filteredUnits.length}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
        />

        {hasCreateAccess && (
          <CreateUnitModal
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
            registerCreate={registerCreate}
            handleSubmitCreate={handleSubmitCreate}
            resetCreate={resetCreate}
            createErrors={createErrors}
            isCreateValid={isCreateValid}
            serverErrors={serverErrors}
            setServerErrors={setServerErrors}
            onCreateSubmit={onCreateSubmit}
            isCreating={isCreating}
          />
        )}

        {/* Status Modal */}
        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
          type={statusModal.status}
          title={statusModal.title}
          message={statusModal.description}
          actionText="Continue"
        />
      </div>
    </PageGuard>
  );
}

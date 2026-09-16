"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestFormConfig } from "@/components/requests/types";
import { useCreatePlantEquipmentRequestMutation } from "@/api/requests/plantEquipmentRequestApi";
import { StatusModal } from "@/components/shared/StatusModal";
import extractErrorMessage from "@/components/requests/utils/RequestErrorHandler";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { PageGuard } from "@/components/auth/PageGuard";

const formSchema = z.object({
  project: z.string().min(1, "Please select a project"),
  phase: z.string().min(1, "Please select a phase"),
  task: z.string().min(1, "Please select an activity"),
  equipmentName: z.string().min(2, "Equipment name is required"),
  description: z.string().optional(),
  quantity: z.coerce
    .number()
    .positive("Enter a valid quantity")
    .min(1, "Quantity must be at least 1"),
  requiredDate: z.string().min(1, "Please select a required date"),
  estimatedCost: z.coerce
    .number()
    .positive("Enter a valid estimated cost")
    .min(0, "Estimated cost cannot be negative"),
  justification: z
    .string()
    .max(500, "Notes too long (max 500 characters)")
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewPlantEquipmentRequestPage() {
  const router = useRouter();
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const loggedInUserName = React.useMemo(() => {
    if (!loggedInUser) return "Current User";
    const anyUser = loggedInUser as any;
    return `${anyUser.first_name || ""} ${anyUser.last_name || ""}`.trim() || loggedInUser.username || "Current User";
  }, [loggedInUser]);

  const [createPlantEquipmentRequest, { isLoading: isCreating }] =
    useCreatePlantEquipmentRequestMutation();

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    description: "",
  });

  const [requestId] = useState("Auto-generated");

  const calculateTotalCost = (data: Partial<FormValues>) => {
    const qty = Number(data.quantity) || 1;
    const cost = Number(data.estimatedCost) || 0;
    return qty * cost;
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      const ensureValidUUID = (val: string): string => {
        if (!val) return "";
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(val)) return val;
        const numericVal = parseInt(val, 10);
        if (!isNaN(numericVal)) {
          const hexString = numericVal.toString(16).padStart(12, "0");
          return `00000000-0000-0000-0000-${hexString}`;
        }
        return val;
      };

      const submitData: any = {
        reference_id: requestId,
        project: parseInt(data.project),
        project_request: parseInt(data.project),
        equipment_name: data.equipmentName,
        description: data.description || "",
        quantity: Number(data.quantity),
        required_date: data.requiredDate,
        estimated_cost: String(data.estimatedCost),
        justification_notes: data.justification || "",
        activity: ensureValidUUID(data.task),
        wbs_element: ensureValidUUID(data.task),
        is_hidden: false,
      };

      await createPlantEquipmentRequest(submitData).unwrap();

      setStatusModal({
        isOpen: true,
        type: "success",
        title: "Request Created",
        description: "Your plant & equipment request has been submitted successfully.",
      });

      setTimeout(() => {
        router.push("/project-request/plant-equipment-request");
      }, 2000);
    } catch (error) {
      console.error("Failed to create plant & equipment request:", error);
      const errorMessage = extractErrorMessage(error);
      setStatusModal({
        isOpen: true,
        type: "error",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const config: RequestFormConfig<FormValues> = {
    title: "Plant & Equipment Request",
    requestId: requestId,
    requesterName: loggedInUserName,
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    sections: [
      {
        title: "Plant & Equipment Details",
        fields: [
          {
            name: "project",
            label: "Project",
            type: "select",
            placeholder: "Select a project",
            options: [],
          },
          {
            name: "equipmentName",
            label: "Equipment Name",
            type: "text",
            placeholder: "Enter equipment name (e.g. Caterpillar Excavator 320D)",
          },
          {
            name: "description",
            label: "Description / Model",
            type: "text",
            placeholder: "Enter description or model details",
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            placeholder: "Enter quantity",
            halfWidth: true,
          },
          {
            name: "requiredDate",
            label: "Required Date",
            type: "date",
            placeholder: "Select required date",
            halfWidth: true,
          },
        ],
      },
      {
        title: "WBS",
        fields: [
          {
            name: "phase",
            label: "Phase",
            type: "select",
            placeholder: "Select a phase",
            options: [],
            dependsOn: "project",
          },
          {
            name: "task",
            label: "Activity",
            type: "select",
            placeholder: "Select an activity",
            options: [],
            dependsOn: "phase",
          },
        ],
      },
      {
        title: "Cost Details",
        fields: [
          {
            name: "estimatedCost",
            label: "Estimated Unit Cost",
            type: "number",
            placeholder: "Enter estimated unit cost",
          },
        ],
      },
      {
        fields: [
          {
            name: "justification",
            label: "Note",
            type: "textarea",
            placeholder: "Enter note",
            rows: 4,
          },
        ],
        renderTop: (data: FormValues, extra?: any) => {
          const total = calculateTotalCost(data);
          const availBudget = extra?.availableBudget || 0;
          return (
            <div className="pb-4 mb-4 border-b border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  Available Budget
                </span>
                <span className="text-sm font-bold text-[#3B7CED]">
                  ₦
                  {availBudget.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  Total Cost
                </span>
                <span className="text-sm font-bold text-[#3B7CED]">
                  ₦
                  {total.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          );
        },
      },
    ],
    schema: formSchema,
    defaultValues: {
      project: "",
      phase: "",
      task: "",
      equipmentName: "",
      description: "",
      quantity: 1,
      requiredDate: new Date().toISOString().split("T")[0],
      estimatedCost: 0,
      justification: "",
    },
    onSubmit: handleSubmit,
    successMessage: {
      title: "Request Submitted",
      description: "Your plant & equipment request has been submitted successfully.",
    },
    backPath: "/project-request/plant-equipment-request",
    calculateProjectedCost: (data) => {
      return calculateTotalCost(data);
    },
  };

  return (
    <PageGuard module="project_request" entitlement="create">
      <RequestForm config={config} />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.description}
      />
    </PageGuard>
  );
}

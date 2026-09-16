"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Form from "@/components/Settings/form/form";
import FormSection from "@/components/Settings/form/FormSection";
import FormInput from "@/components/Settings/form/FormInput";
import PermissionsGrid from "@/components/Settings/PermissionsGrid";
import {
  createEmptyPermissions,
  PermissionTemplate,
  UserPermissions,
  convertPermissionsToApiItems,
} from "@/utils/modulePermissionsStore";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";
import { useCreatePermissionTemplateMutation } from "@/api/settings/permissionsTemplateApi";

export default function NewPermissionTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<UserPermissions>(createEmptyPermissions());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusModal = useStatusModal();
  const [createTemplate] = useCreatePermissionTemplateMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      statusModal.showError("Validation Error", "Template name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        is_active: true,
        items: convertPermissionsToApiItems(permissions),
      };

      await createTemplate(body).unwrap();
      statusModal.showSuccess("Success", "Permission template created successfully!");
      setTimeout(() => {
        router.push("/settings/permission-templates");
      }, 1500);
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", "Failed to create permission template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-6 w-full mx-auto mw-full rounded-xs bg-white">
      <div className="flex px-6 items-center border-b py-4 border-[#E2E6E9]">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-4 text-2xl text-[#717171] hover:underline"
        >
          &larr;
        </button>
        <h1 className="text-xl text-[#1A1A1A] font-normal">Create Permission Template</h1>
      </div>

      <Form onSubmit={handleSave} className="p-6">
        <FormSection title="Template Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <FormInput
              label="Template Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Accountant, Site Supervisor"
              required
            />
          </div>
        </FormSection>

        <FormSection title="Permissions Configuration">
          <p className="text-sm text-gray-500 mb-4 mt-2">
            Configure the default permissions that will be applied to users when using this template.
            Admins can still customize individual cell checkboxes after applying this template to a user.
          </p>
          <PermissionsGrid
            permissions={permissions}
            onChange={setPermissions}
            readOnly={false}
          />
        </FormSection>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/settings/permission-templates")}
            className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-150 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {isSubmitting ? "Creating..." : "Save Template"}
          </button>
        </div>
      </Form>

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </div>
  );
}

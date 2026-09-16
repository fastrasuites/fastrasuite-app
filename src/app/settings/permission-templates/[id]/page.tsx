"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Form from "@/components/Settings/form/form";
import FormSection from "@/components/Settings/form/FormSection";
import FormInput from "@/components/Settings/form/FormInput";
import PermissionsGrid from "@/components/Settings/PermissionsGrid";
import ReadOnlyField from "@/components/Settings/ReadOnlyField";
import {
  createEmptyPermissions,
  convertPermissionsToApiItems,
  convertApiItemsToPermissions,
  convertFrontendTemplateToApi,
} from "@/utils/modulePermissionsStore";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";
import {
  useGetPermissionTemplateQuery,
  useUpdatePermissionTemplateMutation,
  useDeletePermissionTemplateMutation,
  useActivatePermissionTemplateMutation,
  useArchivePermissionTemplateMutation,
  useDuplicatePermissionTemplateMutation,
} from "@/api/settings/permissionsTemplateApi";

export default function PermissionTemplateDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState(createEmptyPermissions());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusModal = useStatusModal();

  const { data: apiTemplate, isLoading, refetch } = useGetPermissionTemplateQuery(Number(templateId), {
    skip: !templateId,
  });

  const template = useMemo(() => {
    if (!apiTemplate) return null;
    return {
      id: String(apiTemplate.id),
      name: apiTemplate.name,
      permissions: convertApiItemsToPermissions(apiTemplate.items),
      isArchived: !apiTemplate.is_active,
      createdAt: apiTemplate.created_at || new Date().toISOString(),
    };
  }, [apiTemplate]);

  const effectivePermissions = editMode ? permissions : (template?.permissions || createEmptyPermissions());
  const effectiveName = editMode ? name : (template?.name || "");

  const [updateTemplate] = useUpdatePermissionTemplateMutation();
  const [deleteTemplate] = useDeletePermissionTemplateMutation();
  const [activateTemplate] = useActivatePermissionTemplateMutation();
  const [archiveTemplate] = useArchivePermissionTemplateMutation();
  const [duplicateTemplate] = useDuplicatePermissionTemplateMutation();

  const revertToTemplate = () => {
    if (template) {
      setName(template.name);
      setPermissions(template.permissions);
    }
  };

  const handleEditToggle = () => {
    revertToTemplate();
    setEditMode((prev) => !prev);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    if (!name.trim()) {
      statusModal.showError("Validation Error", "Template name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTemplate({
        id: Number(template.id),
        body: convertFrontendTemplateToApi({
          id: template.id,
          name: name.trim(),
          permissions,
          isArchived: template.isArchived,
          createdAt: template.createdAt,
        }),
      }).unwrap();
      setEditMode(false);
      statusModal.showSuccess("Success", "Permission template updated successfully!");
      refetch();
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", "Failed to update permission template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!template) return;
    try {
      if (template.isArchived) {
        await activateTemplate({ id: Number(template.id) }).unwrap();
        statusModal.showSuccess("Success", "Template activated successfully!");
      } else {
        await archiveTemplate({ id: Number(template.id) }).unwrap();
        statusModal.showSuccess("Success", "Template archived successfully!");
      }
      refetch();
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", "Failed to toggle archive status.");
    }
  };

  const handleDelete = async () => {
    if (!template) return;
    try {
      await deleteTemplate(Number(template.id)).unwrap();
      statusModal.showSuccess("Success", "Template deleted successfully.");
      setTimeout(() => {
        router.push("/settings/permission-templates");
      }, 1500);
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", "Failed to delete template.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = async () => {
    if (!template) return;
    try {
      await duplicateTemplate({ id: Number(template.id) }).unwrap();
      statusModal.showSuccess("Success", "Template duplicated successfully.");
      router.push("/settings/permission-templates");
    } catch (error) {
      console.error(error);
      statusModal.showError("Error", "Failed to duplicate template.");
    }
  };

  if (isLoading || !template) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-6 w-full mx-auto mw-full rounded-xs bg-white">
      <div className="flex px-6 justify-between border-b py-4 border-[#E2E6E9]">
        <div className="flex px-6 items-center">
          <button
            onClick={() => router.push("/settings/permission-templates")}
            className="mr-4 text-2xl text-[#717171] hover:underline"
          >
            &larr;
          </button>
          <h1 className="text-xl text-[#1A1A1A] font-normal">Template Details</h1>
        </div>
        <div className="flex gap-4">
          <button
            className="text-gray-500 hover:text-amber-600 transition-colors text-sm"
            onClick={handleArchiveToggle}
          >
            {template.isArchived ? "Unarchive Template" : "Archive Template"}
          </button>
          <button
            className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
            onClick={handleDuplicate}
          >
            Duplicate
          </button>
          <button
            className="text-red-500 hover:text-red-700 transition-colors text-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
          <button
            className="text-[#3B7CED] text-sm"
            onClick={handleEditToggle}
          >
            {editMode ? "Back to View" : "Edit"}
          </button>
        </div>
      </div>

      <Form onSubmit={handleSave} className="p-6">
        <FormSection title="Template Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {editMode ? (
              <FormInput
                label="Template Name"
                name="name"
                value={effectiveName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                required
              />
            ) : (
              <ReadOnlyField label="Template Name" value={effectiveName} />
            )}

            <ReadOnlyField
              label="Status"
              value={
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    template.isArchived
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                  }`}
                >
                  {template.isArchived ? "Archived" : "Active"}
                </span>
              }
            />
          </div>
        </FormSection>

        <FormSection title="Permissions Configuration">
          <p className="text-sm text-gray-500 mb-4 mt-2">
            This grid defines the active permission set for this template.
          </p>
          <PermissionsGrid
            permissions={effectivePermissions}
            onChange={setPermissions}
            readOnly={!editMode}
          />
        </FormSection>

        {editMode && (
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                revertToTemplate();
              }}
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-150 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </Form>

      <StatusModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        type="warning"
        title="Delete Template"
        message="Are you sure you want to permanently delete this template? This action cannot be undone."
        actionText="Delete"
        onAction={handleDelete}
        secondaryText="Cancel"
        onSecondary={() => setShowDeleteConfirm(false)}
      />

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

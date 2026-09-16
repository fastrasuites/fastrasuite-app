"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/ProtectedComponent";
import moment from "moment-timezone";
import ISO6391 from "iso-639-1";

import Form from "@/components/Settings/form/form";
import FormSection from "@/components/Settings/form/FormSection";
import FormInput from "@/components/Settings/form/FormInput";
import FormSubmitButton from "@/components/Settings/form/FormSubmitButton";
import FormImageUpload from "@/components/Settings/form/FormImageUpload";
import FormSelect from "@/components/Settings/form/FormSelect";
import FormMultiSelect from "@/components/Settings/form/FormMultiSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { GridCardIcon } from "@/components/icons/gridCardIcon";
import NewUserRoleSelect from "@/components/Settings/form/formRoleSelect";
import ReadOnlyField from "@/components/Settings/ReadOnlyField";
import { LoadingDots } from "@/components/shared/LoadingComponents";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";

import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
  useDeleteUserMutation,
} from "@/api/settings/usersApi";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/utils";

import PermissionsGrid from "@/components/Settings/PermissionsGrid";
import {
  UserPermissions,
  createEmptyPermissions,
  MODULE_KEY_MAP,
  convertApiItemsToPermissions,
} from "@/utils/modulePermissionsStore";
import { useGetPermissionTemplatesQuery } from "@/api/settings/permissionsTemplateApi";
import { useResetPasswordMutation } from "@/api/settings/tenantUserApi";

interface CompanyRoleDetails {
  id: number;
  name: string;
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  company_role: number | null | undefined;
  company_role_details?: CompanyRoleDetails | null;
  phone_number: string;
  language: string;
  timezone: string;
  in_app_notifications: boolean;
  email_notifications: boolean;
  user_image_image?: File | string | null;
}

export default function UsersDetails() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params?.id);

  const tenant_company_name = useSelector(
    (state: any) => state.auth.tenant_company_name,
  );
  const tenant_schema_name = useSelector(
    (state: any) => state.auth.tenant_schema_name,
  );
  const [updateUser] = useUpdateUserByIdMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const { data: permissionTemplates = [], isLoading: templatesLoading } = useGetPermissionTemplatesQuery();

  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "access" | "permissions">("basic");
  const [resetLoading, setResetLoading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const statusModal = useStatusModal();
  const [directPermissions, setDirectPermissions] = useState<UserPermissions>(createEmptyPermissions());

  const [form, setForm] = useState<UserData>({
    first_name: "",
    last_name: "",
    email: "",
    company_role: null,
    company_role_details: null,
    phone_number: "",
    language: "en",
    timezone: "Africa/Abidjan",
    in_app_notifications: true,
    email_notifications: true,
    user_image_image: null,
  });

  const { data: userData, isLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  console.log(userData);

  // Load direct permissions from API response
  useEffect(() => {
    if (userData) {
      setDirectPermissions(
        convertApiItemsToPermissions(userData.permissions || userData.user_permissions),
      );
    }
  }, [userData]);

  // ----------------- Load user data into state -----------------
  useEffect(() => {
    if (userData) {
      setForm({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        company_role: userData.company_role || null,
        company_role_details: userData.company_role_details || null,
        phone_number: userData.phone_number || "",
        language: userData.language || "en",
        timezone: userData.timezone || "Africa/Abidjan",
        in_app_notifications: userData.in_app_notifications ?? true,
        email_notifications: userData.email_notifications ?? true,
        user_image_image: userData.user_image || null,
      });
    }
  }, [userData]);

  // ----------------- Handlers -----------------
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleFileChange = (
    name: "signature_image" | "user_image_image",
    file: File | null,
  ) => {
    setForm((prev) => ({ ...prev, [name]: file }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMode) return;

    try {
      // Use FormData to send files
      const formData = new FormData();

      // Append normal fields
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("email", form.email);
      formData.append("tenant_schema_name", tenant_schema_name || "");
      if (form.company_role !== null)
        formData.append("company_role", String(form.company_role));
      formData.append("phone_number", form.phone_number);
      formData.append("language", form.language);
      formData.append("timezone", form.timezone);
      formData.append(
        "in_app_notifications",
        String(form.in_app_notifications),
      );
      formData.append("email_notifications", String(form.email_notifications));

      // Append files if they exist
      if (form.user_image_image instanceof File) {
        formData.append("user_image_image", form.user_image_image);
      }

      const permissionsPayload = Object.entries(directPermissions)
        .filter(([, perms]) => Object.values(perms).some((v) => v))
        .map(([moduleKey, perms]) => ({
          module: MODULE_KEY_MAP[moduleKey as keyof UserPermissions],
          permission_types: Object.entries(perms)
            .filter(([, selected]) => selected)
            .map(([permType]) => permType),
        }));

      formData.append("permissions", JSON.stringify(permissionsPayload));

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await updateUser({ id: userId, data: formData }).unwrap();

      statusModal.showSuccess("Success", "User updated successfully!");
      setEditMode(false);
    } catch (err: any) {
      console.error(err);
      if (err?.data) {
        statusModal.showError("Error", JSON.stringify(err.data, null, 2));
      } else {
        statusModal.showError("Error", "Failed to update user");
      }
    }
  };

  const handleResetPassword = async () => {
    const targetUserId = userId || Number(userData?.user_id) || Number(userData?.id);
    if (!targetUserId) {
      statusModal.showError("Error", "User ID not found.");
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword({ user_id: targetUserId }).unwrap();
      statusModal.showSuccess(
        "Success",
        "Password reset email sent successfully!",
      );
    } catch (err: any) {
      statusModal.showError(
        "Error",
        extractErrorMessage(err, "Failed to reset password. Please try again."),
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(userId).unwrap();
      setIsConfirmingDelete(false);
      statusModal.showSuccess("User Deleted", "The user has been successfully deleted.");
      setTimeout(() => {
        router.push("/settings/users");
      }, 1500);
    } catch (err: any) {
      console.error("Delete user error:", err);
      setIsConfirmingDelete(false);
      const errMsg = extractErrorMessage(err, "Failed to delete user. Please try again.");
      if (typeof errMsg === "string" && errMsg.toLowerCase().includes("already hidden")) {
        statusModal.showSuccess("User Already Deleted", "This user has already been removed from the active list.");
        setTimeout(() => {
          router.push("/settings/users");
        }, 1500);
        return;
      }
      statusModal.showError("Failed to Delete User", errMsg);
    }
  };

  // ----------------- Options -----------------
  const languageOptions = ISO6391.getAllCodes().map((code) => ({
    label: ISO6391.getName(code),
    value: code,
  }));

  const timezoneOptions = moment.tz.names().map((tz) => ({
    label: tz,
    value: tz,
  }));

  if (isLoading) return <LoadingDots />;

  // ----------------- Render -----------------
  return (
    <div className="pb-6 w-full mx-auto mw-full rounded-xs bg-white">
      {/* Top bar */}
      <div className="flex px-6 justify-between border-b py-4 border-[#E2E6E9]">
        <div className="flex px-6 items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-2xl text-[#717171] hover:underline"
          >
            &larr;
          </button>
          <h1 className="text-xl text-[#1A1A1A] font-normal">User Details</h1>
        </div>
        <PermissionGuard module="settings" entitlement="change_tenantuser">
          <button
            className="text-[#3B7CED]"
            onClick={() => setEditMode((prev) => !prev)}
          >
            {editMode ? "Back to View" : "Edit"}
          </button>
        </PermissionGuard>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 items-center">
        <button
          className={`px-4 py-4 -mb-px font-medium ${
            activeTab === "basic"
              ? "border-b-2 border-blue-600 text-[#3B7CED]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("basic")}
        >
          Basic Settings
        </button>
        <button
          className={`px-4 py-2 -mb-px font-medium ${
            activeTab === "permissions"
              ? "border-b-2 border-blue-600 text-[#3B7CED]"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("permissions")}
        >
          Module Permissions
        </button>
        <div className="ml-auto flex items-center gap-2.5">
          <PermissionGuard module="settings" entitlement="change_tenantuser">
            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="px-4 py-2 bg-[#3B7CED] text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </PermissionGuard>

          <PermissionGuard module="settings" entitlement="change_tenantuser">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isDeleting}
              className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              <span>Delete User</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "basic" && (
        <Form>
          {/* Basic Information Section */}
          <FormSection title="Basic Information" className="pt-10">
            <div className="flex items-center w-full gap-4 mt-6">
              {editMode ? (
                <FormImageUpload
                  label="User Image"
                  image={
                    form.user_image_image
                      ? `data:image/png;base64,${form.user_image_image}`
                      : null
                  }
                  textToDisplay="Upload User Photo"
                  onChange={(file) =>
                    handleFileChange("user_image_image", file)
                  }
                />
              ) : (
                <img
                  src={
                    form.user_image_image
                      ? `data:image/png;base64,${form.user_image_image}`
                      : "/images/userAvatar.png"
                  }
                  className="w-20 h-20 rounded-full"
                  alt="User"
                />
              )}
              <div className="border-l border-[#E6E6E6] py-2 pl-10 ml-6 grid grid-cols-2 gap-8 w-[60%]">
                {editMode ? (
                  <>
                    <FormInput
                      label="First Name"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="Enter First Name"
                      required
                    />
                    <FormInput
                      label="Last Name"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Enter Last Name"
                      required
                    />
                  </>
                ) : (
                  <div className="border-r border-[#E6E6E6]">
                    <ReadOnlyField
                      label="Name"
                      value={
                        `${form.first_name} ${form.last_name}`.trim() || "—"
                      }
                    />
                  </div>
                )}

                {editMode ? (
                  <NewUserRoleSelect
                    value={form.company_role ?? 0}
                    onChange={(val) =>
                      setForm((prev) => ({ ...prev, company_role: val }))
                    }
                  />
                ) : (
                  <ReadOnlyField
                    label="Role"
                    value={form.company_role_details?.name}
                  />
                )}
              </div>
            </div>
          </FormSection>

          {/* Contact Info */}
          <FormSection title="Contact Information">
            <div
              className={`grid ${editMode ? "grid-cols-3" : "grid-cols-6"} gap-4 mt-4`}
            >
              {editMode ? (
                <FormInput
                  label="Phone Number"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              ) : (
                <div className="border-r border-[#E6E6E6]">
                  <ReadOnlyField
                    label="Phone Number"
                    value={form.phone_number}
                  />
                </div>
              )}

              {editMode ? (
                <FormInput
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  type="email"
                  required
                />
              ) : (
                <div className="ml-6">
                  <ReadOnlyField label="Email" value={form.email} />
                </div>
              )}
            </div>
          </FormSection>

          {/* Companies */}
          <FormSection title="Companies">
            <div className="flex items-center gap-4 border border-[#A9B3BC] mt-6 p-4 px-8 rounded-xs w-fit">
              <div className="w-15 h-15 flex items-center justify-center bg-[#E8EFFD] rounded-full">
                <GridCardIcon className="w-4 h-4 text-[#3B7CED]" />
              </div>
              <div>
                <h4 className="text-[#1a1a1a]">Company name</h4>
                <p className="text-[#8C9AA6] text-base">
                  {tenant_company_name || "No Company Available"}
                </p>
              </div>
            </div>
          </FormSection>

          {/* Preferences */}
          <FormSection title="Preferences">
            <div
              className={`grid ${editMode ? "grid-cols-3" : "grid-cols-6"} gap-4 mt-4`}
            >
              {editMode ? (
                <FormSelect
                  label="Language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  placeholder="Select language"
                  options={languageOptions}
                />
              ) : (
                <div className="border-r border-[#E6E6E6]">
                  <ReadOnlyField label="Language" value={form.language} />
                </div>
              )}

              {editMode ? (
                <FormSelect
                  label="Timezone"
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  placeholder="Select timezone"
                  options={timezoneOptions}
                />
              ) : (
                <div className="ml-6">
                  <ReadOnlyField label="Timezone" value={form.timezone} />
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="mt-6 flex flex-col gap-4">
              <label className="font-medium text-sm text-[#1A1A1A]">
                Notification Preferences
              </label>

              {["in_app_notifications", "email_notifications"].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 w-full justify-between"
                >
                  {editMode ? (
                    <>
                      <label
                        htmlFor={key}
                        className="text-sm text-[#7A8A98] cursor-pointer"
                      >
                        {key === "in_app_notifications"
                          ? "In-app Notifications"
                          : "Email Notifications"}
                      </label>
                      <Checkbox
                        checked={Boolean(form[key as keyof UserData])}
                        onCheckedChange={(checked) =>
                          setForm((prev) => ({
                            ...prev,
                            [key]: Boolean(checked),
                          }))
                        }
                        id={key}
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className=" text-[#7A8A98]">
                        {key === "in_app_notifications"
                          ? "In-app Notifications"
                          : "Email Notifications"}
                      </label>

                      <Checkbox
                        checked={Boolean(form[key as keyof UserData])}
                        disabled
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FormSection>

          {/* Footer Buttons */}
          {editMode && activeTab === "basic" && (
            <div className="mt-6 flex justify-end gap-4 px-6">
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          )}
        </Form>
      )}

      {/* Module Permissions Tab */}
      {activeTab === "permissions" && (
        <Form onSubmit={handleSave}>
          <FormSection title="Module Permissions Grid">
            {editMode && (
              <div className="mb-6 max-w-md mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply Permission Template (Optional)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const selected = permissionTemplates.find((t: any) => t.id === Number(e.target.value));
                      if (selected) {
                        setDirectPermissions(convertApiItemsToPermissions(selected.items));
                      }
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  defaultValue=""
                  disabled={templatesLoading}
                >
                  <option value="" disabled>-- Select a Template --</option>
                  {permissionTemplates
                    .filter((t: any) => t.is_active)
                    .map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div className="mt-4">
              <PermissionsGrid
                permissions={directPermissions}
                onChange={setDirectPermissions}
                readOnly={!editMode}
              />
            </div>
          </FormSection>

          {editMode && (
            <div className="mt-6 flex justify-end gap-4 px-6">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          )}
        </Form>
      )}

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent className="max-w-md p-6 bg-white rounded-xl shadow-xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {form.first_name} {form.last_name}
              </span>{" "}
              ({form.email})? This user will be removed from your organization and lose all access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={isDeleting}
              className="px-4 py-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Yes, Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

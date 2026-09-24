"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { SettingsGrid } from "@/components/Settings/settingsGrid";
import { ReusableTable } from "@/components/Settings/settingsReusableTable";
import { GridCardIcon } from "@/components/icons/gridCardIcon";
import { useGetUsersQuery, useDeleteUserMutation } from "@/api/settings/usersApi";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertTriangle, Loader2, Lock } from "lucide-react";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusModal, { useStatusModal } from "@/components/shared/StatusModal";
import { extractErrorMessage } from "@/lib/utils";
import { PermissionGuard } from "@/components/ProtectedComponent";

type ApiUser = {
  id?: number | string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
};

type User = {
  id: number | string;
  name: string;
  email: string;
  firstname?: string;
  lastname?: string;
  status: string;
  companyRole?: string;
  phone?: string;
  timezone?: string;
};

export default function Users() {
  const viewMode = useSelector((state: RootState) => state.viewMode.mode);
  const archive = useSelector((state: RootState) => state.viewMode.archive);
  const archiveFlag = !!archive;
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? "";

  const { data: users, isLoading, isFetching, refetch } = useGetUsersQuery();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const statusModal = useStatusModal();

  const { isUserAccessible, restrictedUsersCount } = useSubscriptionLimits();

  // Navigate to user detail page
  const handleUserClick = (id?: string | number) => {
    if (id && !isUserAccessible(id)) {
      statusModal.showError(
        "User Access Restricted",
        "This user account was created under a higher subscription plan and is currently locked because your account exceeds the user limit for your current plan. Upgrade your plan to restore access."
      );
      return;
    }
    router.push(`/settings/users/${id}`);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id).unwrap();
      const deletedName = userToDelete.name || userToDelete.email;
      setUserToDelete(null);
      statusModal.showSuccess("User Deleted", `User "${deletedName}" has been successfully deleted.`);
      refetch();
    } catch (err: any) {
      console.error("Delete user error:", err);
      setUserToDelete(null);
      const errMsg = extractErrorMessage(err, "Failed to delete user. Please try again.");
      if (typeof errMsg === "string" && errMsg.toLowerCase().includes("already hidden")) {
        statusModal.showSuccess("User Already Deleted", "This user has already been removed from the active list.");
        refetch();
        return;
      }
      statusModal.showError("Failed to Delete User", errMsg);
    }
  };

  // 👉 Loading state with skeleton
  if (isLoading || (!users && isFetching)) {
    return (
      <div className="py-4 w-full">
        {viewMode === "grid" ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`skeleton-card-${index}`}
                className="flex flex-col items-center bg-white border border-[#E2E6E9] rounded-sm p-4 shadow-xs"
              >
                <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-3" />
                <Skeleton className="h-5 w-32 bg-gray-200 mb-3" />
                <div className="flex flex-col items-center gap-2 w-full">
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-4 w-40 bg-gray-200" />
                  <Skeleton className="h-4 w-28 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 border border-[#E2E6E9] rounded-sm shadow-xs w-full">
            <div className="bg-[#F1F2F4] p-3 rounded-t-sm flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-4 rounded bg-gray-300" />
              <Skeleton className="h-4 w-28 bg-gray-300" />
              <Skeleton className="h-4 w-40 bg-gray-300 hidden md:block" />
              <Skeleton className="h-4 w-28 bg-gray-300 hidden lg:block" />
              <Skeleton className="h-4 w-24 bg-gray-300 hidden lg:block" />
              <Skeleton className="h-4 w-20 bg-gray-300 hidden xl:block" />
            </div>
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`skeleton-row-${index}`}
                  className="p-3 flex items-center justify-between gap-4"
                >
                  <Skeleton className="h-4 w-4 rounded bg-gray-200" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                    <Skeleton className="h-4 w-28 bg-gray-200" />
                  </div>
                  <Skeleton className="h-4 w-40 bg-gray-200 hidden md:block" />
                  <Skeleton className="h-4 w-28 bg-gray-200 hidden lg:block" />
                  <Skeleton className="h-4 w-24 bg-gray-200 hidden lg:block" />
                  <Skeleton className="h-4 w-20 bg-gray-200 hidden xl:block" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const formattedUsers: (User & { is_hidden?: boolean })[] =
    users?.map((u: any) => {
      const isHidden =
        u.is_hidden === true ||
        u.status?.toLowerCase() === "archived" ||
        u.status?.toLowerCase() === "hidden" ||
        u.is_active === false;

      return {
        id: u.id,
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
        email: u.email,
        companyRole: u.company_role_details?.name ?? "—", // ROLE NAME
        phone: u.phone_number ?? "—",
        timezone: u.timezone ?? "—", // optional
        status: isHidden ? "archived" : (u.status ?? "active"),
        is_hidden: isHidden,
      };
    }) ?? [];

  const baseDataset = archiveFlag
    ? formattedUsers.filter((u) => u.is_hidden)
    : formattedUsers.filter((u) => !u.is_hidden);

  const searchLower = searchQuery.toLowerCase();
  const searchedDataset = searchLower
    ? baseDataset.filter((u) =>
        Object.values(u).some((val) =>
          String(val).toLowerCase().includes(searchLower),
        ),
      )
    : baseDataset;

  // 👉 Empty state
  if (searchedDataset.length === 0) {
    return (
      <div className="py-20 w-full flex flex-col items-center justify-center text-center">
        <img
          src="/images/userAvatar.png"
          className="w-20 h-20 opacity-40 mb-4"
          alt="No users"
        />
        <p className="text-gray-500 text-lg">No user has been created yet</p>
      </div>
    );
  }

  const headers = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "companyRole", label: "Company Role" },
    { key: "phone", label: "Phone" },
    { key: "timezone", label: "Timezone" },
    ...(archiveFlag ? [{ key: "status", label: "Status" }] : []),
    { key: "actions", label: "" },
  ];

  return (
    <div className="py-4 w-full">
      {restrictedUsersCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 mb-4 flex items-center justify-between text-amber-900 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{restrictedUsersCount} recent user(s)</strong> are currently locked due to plan tier limits. Upgrade your plan to restore access.
            </span>
          </div>
          <Button
            onClick={() => router.push("/settings/billing")}
            className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] h-7 px-3 font-semibold rounded cursor-pointer"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {viewMode === "grid" ? (
        <SettingsGrid
          icon={<GridCardIcon />}
          dataList={searchedDataset}
          type="user"
          fieldsToShow={["companyRole", "email", "phone"]}
          onItemClick={handleUserClick}
        />
      ) : (
        <ReusableTable
          headers={headers}
          data={searchedDataset}
          className="bg-white p-4"
          headerClassName="bg-[#F1F2F4]"
          headerTextColor="text-[#7A8A98]"
          bodyTextColor="text-[#1A1A1A]"
          type="user"
          icon={
            <img
              src="/images/userAvatar.png"
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
          }
          iconWrapperClassName="bg-[#E8EFFD]"
          striped
          hover
          checkbox
          renderCell={(row, key) => {
            if (key === "name") {
              const isAccessible = row.id ? isUserAccessible(row.id) : true;
              return (
                <div className="flex items-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full mr-2 bg-[#E8EFFD]">
                    <img
                      src="/images/userAvatar.png"
                      alt="User Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{row[key]}</span>
                    {!isAccessible && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            }
            if (key === "actions") {
              return (
                <div
                  className="flex items-center justify-end pr-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PermissionGuard module="settings" entitlement="change_tenantuser">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserToDelete(row);
                      }}
                      title="Delete User"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </PermissionGuard>
                </div>
              );
            }
            return row[key] ?? "—";
          }}
          showStatusColumn={archive}
          onRowClick={handleUserClick}
        />
      )}

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setUserToDelete(null);
        }}
      >
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
                {userToDelete?.name || userToDelete?.email}
              </span>
              {userToDelete?.email ? ` (${userToDelete.email})` : ""}? This user will be removed from your organization and lose all access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToDelete(null)}
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

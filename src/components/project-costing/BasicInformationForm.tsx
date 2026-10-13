import React, { useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetActiveLocationsQuery } from "@/api/inventory/locationApi";
import { useGetTenantUsersQuery } from "@/api/settings/tenantUserApi";
import { CreateLocationModal } from "./modals/CreateLocationModal";
import { Loader2, Plus, MapPin, RefreshCw } from "lucide-react";

interface BasicInformationFormProps {
  name: string;
  setName: (val: string) => void;
  clientName: string;
  setClientName: (val: string) => void;
  projectType: string;
  setProjectType: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  expectedEndDate: string;
  setExpectedEndDate: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  siteLocation: string;
  setSiteLocation: (val: string) => void;
  projectManager?: string;
  setProjectManager?: (val: string) => void;
  autoFillCurrentUser?: boolean;
}

export function BasicInformationForm({
  name,
  setName,
  clientName,
  setClientName,
  projectType,
  setProjectType,
  startDate,
  setStartDate,
  expectedEndDate,
  setExpectedEndDate,
  description,
  setDescription,
  siteLocation,
  setSiteLocation,
  projectManager = "",
  setProjectManager,
  autoFillCurrentUser = false,
}: BasicInformationFormProps) {
  const {
    data: activeLocations,
    isLoading: isLoadingLocations,
    refetch: refetchLocations,
  } = useGetActiveLocationsQuery();

  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);

  // Redux auth state for auto-filling current user
  const authUser = useSelector((state: RootState) => state.auth.user);
  const tenantUserId = useSelector((state: RootState) => state.auth.tenant_user_id);

  // Tenant users query for Project Manager
  const {
    data: tenantUsers,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useGetTenantUsersQuery({});

  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      await refetchUsers();
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const userOptions = React.useMemo(() => {
    if (!tenantUsers || !Array.isArray(tenantUsers)) return [];
    return tenantUsers
      .filter((tu: any) => {
        if (!tu) return false;
        if (
          tu.is_hidden ||
          tu.is_active === false ||
          tu.status?.toLowerCase() === "archived" ||
          tu.status?.toLowerCase() === "hidden"
        ) {
          return false;
        }
        return true;
      })
      .map((tu: any) => {
        const id = tu.id || tu.user_id;
        const firstName = tu.user?.first_name || tu.first_name || "";
        const lastName = tu.user?.last_name || tu.last_name || "";
        const email = tu.user?.email || tu.email || "";
        const username = tu.user?.username || tu.username || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = fullName || username || email || `User #${id}`;
        const role = tu.company_role_details?.name;
        return {
          id: String(id),
          value: String(id),
          label: displayName,
          email,
          role,
          tu,
        };
      })
      .filter((opt) => !!opt.value);
  }, [tenantUsers]);

  // Auto-fill logged-in user on initial load if configured (e.g. on new project page)
  const hasAutoFilledRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoFillCurrentUser || !setProjectManager || hasAutoFilledRef.current) return;
    if (projectManager) {
      hasAutoFilledRef.current = true;
      return;
    }
    if (userOptions.length > 0) {
      const match = userOptions.find((u) => {
        if (tenantUserId && u.value === String(tenantUserId)) return true;
        if (authUser?.id && (u.value === String(authUser.id) || u.tu?.user_id === authUser.id)) return true;
        if (authUser?.email && u.email && u.email.toLowerCase() === authUser.email.toLowerCase()) return true;
        return false;
      });
      if (match) {
        setProjectManager(match.value);
        hasAutoFilledRef.current = true;
      }
    }
  }, [autoFillCurrentUser, projectManager, setProjectManager, userOptions, tenantUserId, authUser]);

  const internalLocations = React.useMemo(() => {
    if (!activeLocations || !Array.isArray(activeLocations)) return [];
    return activeLocations.filter((loc: any) => {
      // Exclude hidden or inactive locations
      if (loc.is_hidden || loc.is_active === false) return false;

      // Only allow internal locations (exclude partner, customer, supplier/vendor locations)
      const locType = (loc.location_type || "").toLowerCase().trim();
      if (locType && locType !== "internal") {
        return false;
      }

      // Safeguard against customer, supplier, vendor, partner locations by name
      const name = (loc.location_name || loc.name || "").toLowerCase();
      if (
        name.includes("customer") ||
        name.includes("supplier") ||
        name.includes("vendor") ||
        name.includes("partner")
      ) {
        return false;
      }

      return true;
    });
  }, [activeLocations]);

  const handleLocationCreated = async (newLocationId: string) => {
    await refetchLocations();
    setSiteLocation(newLocationId);
  };

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  return (
    <section>
      <h2 className="text-[#3B7CED] text-xl mb-6">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 font-medium">Project Name</Label>
          <Input
            placeholder="Enter Project Name"
            className="bg-white border-gray-300 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 font-medium">Client Name</Label>
          <Input
            placeholder="Enter Client Name"
            className="bg-white border-gray-300 rounded"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 font-medium">Project Type</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger className="bg-white border-gray-300 rounded text-gray-700 h-10">
              <SelectValue placeholder="Select Project Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="Software Development">Software Development</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Procurement">Procurement</SelectItem>
              <SelectItem value="Consultancy">Consultancy</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 font-medium">Start date</Label>
          <Input
            type="date"
            min={todayStr}
            placeholder="Enter date"
            className="bg-white border-gray-300 rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-gray-700 font-medium">Expected End Date</Label>
          <Input
            type="date"
            min={startDate || todayStr}
            placeholder="Enter date"
            className="bg-white border-gray-300 rounded"
            value={expectedEndDate}
            onChange={(e) => setExpectedEndDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-gray-700 font-medium">Site Location</Label>
            <button
              type="button"
              onClick={() => setIsCreateLocationOpen(true)}
              className="text-xs text-[#3B7CED] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Location</span>
            </button>
          </div>

          <Select value={siteLocation} onValueChange={setSiteLocation}>
            <SelectTrigger className="bg-white border-gray-300 rounded text-gray-700 h-10">
              {isLoadingLocations ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <SelectValue placeholder={internalLocations.length === 0 ? "No locations (Click 'Add Location' to create)" : "Select Site Location"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {internalLocations.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500">
                  No internal locations found.
                </div>
              ) : (
                internalLocations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.location_name || loc.name || loc.id}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-gray-700 font-medium">Project Manager</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshUsers}
                disabled={isLoadingUsers || isRefreshingUsers}
                title="Refresh user list"
                className="text-gray-400 hover:text-[#3B7CED] transition-colors p-0.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoadingUsers || isRefreshingUsers ? "animate-spin text-[#3B7CED]" : ""
                  }`}
                />
              </button>
              <Link
                href="/settings/users/newUser"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#3B7CED] hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </Link>
            </div>
          </div>

          <Select
            value={projectManager || ""}
            onValueChange={(val) => {
              if (setProjectManager) {
                setProjectManager(val === "unassigned" ? "" : val);
              }
            }}
          >
            <SelectTrigger className="bg-white border-gray-300 rounded text-gray-700 h-10">
              {isLoadingUsers ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400">Loading users...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select Project Manager" />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="unassigned">
                <span className="text-gray-400 italic">Unassigned (None)</span>
              </SelectItem>
              {projectManager && !userOptions.some((opt) => opt.value === projectManager) && (
                <SelectItem value={projectManager}>
                  Project Manager #{projectManager}
                </SelectItem>
              )}
              {userOptions.length === 0 && !isLoadingUsers ? (
                <div className="p-3 text-center text-xs text-gray-500">
                  No active users found. (Click &apos;Add User&apos; to create)
                </div>
              ) : (
                userOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span className="font-medium text-gray-800">{opt.label}</span>
                      {opt.role && (
                        <span className="text-[11px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          {opt.role}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-gray-700 font-medium">Description</Label>
          <Input
            placeholder="Enter descriptions"
            className="bg-white border-gray-300 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <CreateLocationModal
        isOpen={isCreateLocationOpen}
        onClose={() => setIsCreateLocationOpen(false)}
        onSuccess={handleLocationCreated}
      />
    </section>
  );
}

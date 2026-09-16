import React, { useState } from "react";
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
import { CreateLocationModal } from "./modals/CreateLocationModal";
import { Loader2, Plus, MapPin } from "lucide-react";

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
}: BasicInformationFormProps) {
  const {
    data: activeLocations,
    isLoading: isLoadingLocations,
    refetch: refetchLocations,
  } = useGetActiveLocationsQuery();

  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);

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

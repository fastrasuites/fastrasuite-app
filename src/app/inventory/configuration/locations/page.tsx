"use client";

import React, { useState, useMemo } from "react";
import { Search, MapPin, AlertCircle, Loader2 } from "lucide-react";
import Breadcrumbs from "@/components/shared/BreadScrumbs";
import { BreadcrumbItem } from "@/components/shared/types";
import { Button } from "@/components/ui/button";
import { AutoSaveIcon } from "@/components/shared/icons";
import { ViewToggle } from "@/components/inventory/location/ViewToggle";
import { LocationCards } from "@/components/inventory/location/LocationCards";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useGetLocationsQuery } from "@/api/inventory/locationApi";
import { PageGuard } from "@/components/auth/PageGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import type { Location } from "@/types/location";
import { extractErrorMessage } from "@/lib/utils";
// Error state component
interface ErrorStateProps {
  error: unknown;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage = extractErrorMessage(error, "An error occurred while fetching locations.");

  return (
    <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to load locations
      </h3>
      <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
      <Button variant="outline" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <Loader2 className="w-8 h-8 text-[#3B7CED] animate-spin mx-auto mb-4" />
      <p className="text-sm text-gray-600">Loading locations...</p>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  hasSearchQuery: boolean;
}

function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No locations found
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {hasSearchQuery
          ? "No locations match your search criteria."
          : "Get started by creating your first location."}
      </p>
      {!hasSearchQuery && (
        <Link href="/inventory/configuration/locations/new">
          <Button variant="contained">Create Location</Button>
        </Link>
      )}
    </div>
  );
}

// Location Table Component
interface LocationTableProps {
  locations: Location[];
  selectedLocations: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
}

function LocationTable({
  locations,
  selectedLocations,
  onToggleSelection,
  onToggleSelectAll,
}: LocationTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
        <div className="col-span-1 flex items-center">
          <input
            type="checkbox"
            checked={
              selectedLocations.length === locations.length &&
              locations.length > 0
            }
            onChange={onToggleSelectAll}
            className="w-4 h-4 text-[#3B7CED] border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="col-span-2">Location ID</div>
        <div className="col-span-2">Location Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Address</div>
        <div className="col-span-2">Contact</div>
      </div>

      {/* Table Body */}
      {locations.map((location: Location) => (
        <Link
          key={location.id}
          href={`/inventory/configuration/locations/${location.id}`}
          className="block"
        >
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center cursor-pointer">
            <div
              className="col-span-1 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selectedLocations.includes(location.id)}
                onChange={() => onToggleSelection(location.id)}
                className="w-4 h-4 text-[#3B7CED] border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <MapPin size={16} className="text-[#3B7CED]" />
              <span className="text-sm text-gray-900">
                {location.location_code}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-gray-900">
                {location.location_name}
              </span>
            </div>
            <div className="col-span-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  location.location_type === "internal"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {location.location_type === "internal" ? "Internal" : "Partner"}
              </span>
            </div>
            <div className="col-span-3">
              <span className="text-sm text-gray-600 truncate block">
                {location.address}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-gray-600">
                {location.contact_information || "-"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Main Page Component
export default function InventoryLocationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Fetch locations from API
  const {
    data: locations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetLocationsQuery({
    search: searchQuery || undefined,
  });
  const queryLoading = isLoading as boolean;

  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Inventory", href: "/inventory" },
    { label: "Configuration", href: "/inventory/configuration" },
    { label: "Locations", href: "/inventory/configuration/locations", current: true },
  ];

  // Filter locations based on search query (client-side filtering as backup)
  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(
      (location) =>
        location.location_name.toLowerCase().includes(query) ||
        location.location_code.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        location.contact_information?.toLowerCase().includes(query),
    );
  }, [locations, searchQuery]);

  const toggleLocationSelection = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((locId) => locId !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedLocations.length === filteredLocations.length) {
      setSelectedLocations([]);
    } else {
      setSelectedLocations(filteredLocations.map((loc) => loc.id));
    }
  };

  const handleViewChange = (view: "grid" | "list") => {
    setViewMode(view);
  };

  return (
    <PageGuard module="inventory" entitlement="view_location">
      <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb */}
        <Breadcrumbs
          items={items}
          action={
            <Button
              variant="ghost"
              className="text-sm text-gray-400 flex items-center gap-2 hover:text-[#3B7CED] transition-colors duration-200"
            >
              Autosaved <AutoSaveIcon />
            </Button>
          }
        />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Location
                </h2>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <PermissionGuard module="inventory" entitlement="add_location">
                  <Link href="/inventory/configuration/locations/new">
                    <Button variant={"contained"}>Create Location</Button>
                  </Link>
                </PermissionGuard>

                <ViewToggle
                  currentView={viewMode}
                  onViewChange={handleViewChange}
                />
              </div>
            </div>

            {/* Location Cards */}
            <div className="space-y-4 mb-6">
              {/* Suppliers Location Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-[#3B7CED]" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Suppliers Location
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Products coming in from suppliers (PO)
                </span>
              </div>

              {/* Customers Location Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between hover:border-gray-300 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-[#3B7CED]" />
                  </div>
                  <span className="text-base font-medium text-gray-900">
                    Customers Location
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Product going out to customers (deliveries).
                </span>
              </div>
            </div>

            {/* Content States */}
            {queryLoading ? (
              <LoadingState />
            ) : isError ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : filteredLocations.length === 0 ? (
              <EmptyState hasSearchQuery={!!searchQuery} />
            ) : viewMode === "list" ? (
              <LocationTable
                locations={filteredLocations}
                selectedLocations={selectedLocations}
                onToggleSelection={toggleLocationSelection}
                onToggleSelectAll={toggleSelectAll}
              />
            ) : (
              <LocationCards locations={filteredLocations} />
            )}

            {/* Results count */}
            {!queryLoading && !isError && filteredLocations.length > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredLocations.length} location
                {filteredLocations.length !== 1 ? "s" : ""}
                {selectedLocations.length > 0 &&
                  ` (${selectedLocations.length} selected)`}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </PageGuard>
  );
}

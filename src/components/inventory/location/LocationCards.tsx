import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, User, Phone } from "lucide-react";
import type { Location } from "@/types/location";
import { cn } from "@/lib/utils";

interface LocationCardsProps {
  locations: Location[];
}

interface LocationCardProps {
  location: Location;
  index: number;
}

function LocationCard({ location, index }: LocationCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/inventory/configuration/locations/${location.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay: index * 0.1,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow border-2 border-gray-200 hover:border-gray-300 shadow-none rounded"
        )}
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <MapPin size={16} className="text-[#3B7CED]" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                  {location.location_name}
                </CardTitle>
              </div>
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
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Location Code */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Location Code:</span>
              <span className="text-sm font-mono font-medium text-gray-900">
                {location.location_code}
              </span>
            </div>

            {/* Address */}
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">Address:</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-40 truncate">
                {location.address}
              </span>
            </div>

            {/* Manager */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <User size={12} />
                Manager:
              </span>
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {location.location_manager_details?.user?.first_name &&
                location.location_manager_details?.user?.last_name
                  ? `${location.location_manager_details.user.first_name} ${location.location_manager_details.user.last_name}`
                  : "-"}
              </span>
            </div>

            {/* Contact */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={10} />
                Contact:
              </span>
              <span className="text-xs text-gray-600">
                {location.contact_information || "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function LocationCards({ locations }: LocationCardsProps) {
  return (
    <motion.div
      className="bg-white h-full rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Location Cards Grid */}
      {locations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
          {locations.map((location, index) => (
            <LocationCard key={location.id} location={location} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          className="flex items-center justify-center h-64"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <MapPin className="w-full h-full" />
            </div>
            <p className="text-gray-400 text-sm">No locations found</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

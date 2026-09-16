import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Vendor } from "../../../types/purchase";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface VendorCardsProps {
  vendors: Vendor[];
}

interface VendorCardProps {
  vendor: Vendor;
  index: number;
}

function VendorCard({ vendor, index }: VendorCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/purchase/vendors/${vendor.id}`);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <div className="flex flex-col items-center gap-3">
            <Image
              src={
                `data:image/png;base64,${vendor.profile_picture}` ||
                "/vendor_dummy.png"
              }
              alt={vendor.name}
              width={200}
              height={200}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl font-semibold text-gray-900 truncate">
                {vendor.name}
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="-mt-8">
          <div className="space-y-4">
            {/* Email */}
            <div className="flex justify-center text-center items-start gap-2">
              <span className="text-sm text-center text-gray-600 leading-relaxed">
                {vendor.email}
              </span>
            </div>

            {/* Phone */}
            <div className="flex justify-center text-center items-start gap-2">
              <span className="text-sm text-center text-gray-600 leading-relaxed">
                {vendor.phone}
              </span>
            </div>

            {/* Address */}
            <div className="flex justify-center text-center items-start gap-2">
              <span className="text-sm text-center text-gray-600 leading-relaxed truncate">
                {vendor.address}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function VendorCards({ vendors }: VendorCardsProps) {
  return (
    <motion.div
      className="px-6 bg-white h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Vendor Cards Grid */}
      {vendors.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6">
          {vendors.map((vendor, index) => (
            <VendorCard key={vendor.id} vendor={vendor} index={index} />
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
              <svg
                className="w-full h-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No vendors found</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

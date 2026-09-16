import React, { ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

interface ProductImageUploadProps {
  avatarSrc: string | null;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function EditProductImageUpload({
  avatarSrc,
  onImageChange,
}: ProductImageUploadProps) {
  return (
    <motion.div
      className="mb-6 flex"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <label htmlFor="avatarUpload" className="group block">
          <motion.div
            className="w-24 h-24 md:w-24 md:h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-sm"
            style={{ borderRadius: 9999 }}
            whileHover={{
              boxShadow: "0 4px 12px rgba(59, 123, 237, 0.15)",
              backgroundColor: "rgba(239, 246, 255, 1)",
            }}
            transition={{ duration: 0.2 }}
          >
            {avatarSrc ? (
              <motion.img
                src={avatarSrc}
                alt="Product"
                className="w-24 h-24 object-cover rounded-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center text-blue-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-300"
                  whileHover={{
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C13.6569 2 15 3.34315 15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2Z"
                      fill="#93C5FD"
                    />
                    <path
                      d="M4 20C4 16 7.582 14 12 14C16.418 14 20 16 20 20"
                      fill="#DBEAFE"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </label>

        {/* Edit badge */}
        <motion.label
          htmlFor="avatarUpload"
          className="absolute -bottom-1 -right-1 bg-blue-500 border-2 border-white rounded-full p-1 hover:bg-blue-600 focus-within:ring-2 focus-within:ring-blue-200 cursor-pointer"
          title="Edit image"
          whileHover={{
            scale: 1.1,
            backgroundColor: "#2563eb",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            whileHover={{ rotate: 45 }}
            transition={{ duration: 0.2 }}
          >
            <Pencil size={14} color="#fff" />
          </motion.div>
        </motion.label>

        <input
          id="avatarUpload"
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="sr-only"
        />
      </motion.div>
    </motion.div>
  );
}

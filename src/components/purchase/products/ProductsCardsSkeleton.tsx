import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProductsCardsSkeletonProps {
  itemCount?: number;
}

export function ProductsCardsSkeleton({
  itemCount = 8,
}: ProductsCardsSkeletonProps) {
  const skeletonItems = Array.from({ length: itemCount }, (_, index) => index);

  return (
    <motion.div
      className="px-6 bg-white h-full mt-6 rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
        {skeletonItems.map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
              delay: index * 0.1,
            }}
          >
            <Card className="border-2 border-gray-200 rounded">
              <CardHeader>
                <motion.div
                  className="h-6 bg-gray-200 rounded"
                  style={{
                    background:
                      "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                    backgroundSize: "200% 100%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <motion.div
                      className="h-4 w-16 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="h-4 w-20 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <motion.div
                      className="h-4 w-14 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="h-4 w-12 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <motion.div
                      className="h-3 w-18 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="h-3 w-16 bg-gray-200 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

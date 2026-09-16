import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "../../../types/purchase";
import { cn } from "@/lib/utils";

interface ProductsCardsProps {
  products: Product[];
}

interface ProductCardProps {
  product: Product;
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/purchase/products/${product.id}`);
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
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {product.name}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Category */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Category:</span>
              <span className="text-sm font-medium text-gray-900">
                {product.category}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Quantity:</span>
              <span className="text-sm font-medium text-gray-900">
                {product.quantity}
              </span>
            </div>

            {/* Product ID */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Product ID:</span>
              <span className="text-xs font-mono text-gray-600">
                {product.id}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ProductsCards({ products }: ProductsCardsProps) {
  return (
    <motion.div
      className="px-6 bg-white h-full mt-6 rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Products Cards Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No products found</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

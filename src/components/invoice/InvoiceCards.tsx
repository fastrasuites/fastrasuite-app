import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";
import { InvoiceRow } from "./types";

interface InvoiceCardsProps {
  Invoices: InvoiceRow[];
}

interface InvoiceCardProps {
  request: InvoiceRow;
  index: number;
}

function InvoiceCard({ request, index }: InvoiceCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/invoice/${request.id}`);
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
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {request.vendor}
              </CardTitle>
              <StatusPill status={request.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Invoice ID */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Invoice ID:</span>
              <span className="text-sm font-medium text-gray-900 font-mono">
                {request.id}
              </span>
            </div>

            {/* Date Created */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date Created:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.dateCreated}
              </span>
            </div>

            {/* Due Date */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Due Date:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.dueDate}
              </span>
            </div>

            {/* Amount Paid */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.amount}
              </span>
            </div>

            {/* Balance Due */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Due:</span>
              <span className="text-sm font-medium text-gray-900">
                {request.due}
              </span>
            </div>

            {/* Total Amount */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">
                Total Amount:
              </span>
              <span className="text-sm font-bold text-gray-900">
                {request.totalAmount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function InvoiceCards({ Invoices }: InvoiceCardsProps) {
  return (
    <motion.div
      className="px-6 bg-white h-full mt-6 rounded-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Purchase Request Cards Grid */}
      {Invoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-6">
          {Invoices.map((request, index) => (
            <InvoiceCard key={request.id} request={request} index={index} />
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
            <p className="text-gray-400 text-sm">No invoices found</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

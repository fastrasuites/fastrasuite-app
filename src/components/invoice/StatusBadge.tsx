"use client";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      Issued: { bg: "bg-blue-100", text: "text-blue-700" },
      Paid: { bg: "bg-green-100", text: "text-green-700" },
      Cancelled: { bg: "bg-red-100", text: "text-red-700" },
      Draft: { bg: "bg-gray-100", text: "text-gray-700" },
      "Pending Approval": { bg: "bg-yellow-100", text: "text-yellow-700" },
    };
    return config[status] || { bg: "bg-gray-100", text: "text-gray-700" };
  };

  const { bg, text } = getStatusConfig(status);

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} ${className}`}
    >
      {status}
    </span>
  );
}

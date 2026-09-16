"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, Lock, ArrowLeft } from "lucide-react";
import CreateSubcontractorBillModal from "@/components/invoice/subcontractor/CreateSubcontractorBillModal";
import ConfirmCompletionModal from "@/components/invoice/subcontractor/ConfirmCompletionModal";
import PMCompletionRecord from "@/components/invoice/PMCompletionRecord";

// Mock data for subcontractor PO detail
const mockSubcontractorPO = {
  id: "PO0018",
  subcontractorName: "John Doe",
  scopeOfWork: "Engineering",
  projectName: "Concrete Works",
  wbs: "WBS-1.3.1 – Concrete Works",
  expectedCompletionDate: "2024-05-15",
  requestType: "Subcontractor",
  paymentType: "Milestone",
  contractValue: 600000,
  committed: 600000,
  actualPaid: 0,
  milestones: [
    {
      id: 1,
      name: "Milestone 1",
      status: "Completed",
      description:
        "Site clearing completed to satisfaction. Survey certificate received from Samples & Assoc. dated 05 April 2024.",
      amount: 200000,
      completedBy: "J. Doe",
      completedDate: "2024-04-08 09:14",
      pmNote:
        "Site clearing completed to satisfaction. Survey certificate received from Samples & Assoc. dated 05 April 2024.",
    },
    {
      id: 2,
      name: "Milestone 2",
      status: "In progress",
      description: "",
      amount: 200000,
    },
    {
      id: 3,
      name: "Milestone 3",
      status: "Locked",
      description: "",
      amount: 200000,
    },
  ],
};

export default function SubcontractorPurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [poData, setPoData] = useState(mockSubcontractorPO);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "In progress":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "Locked":
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "In progress":
        return "bg-yellow-100 text-yellow-700";
      case "Locked":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const handleMarkComplete = (milestone: any) => {
    setSelectedMilestone(milestone);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmComplete = (note: string) => {
    // Update milestone status
    const updatedMilestones = poData.milestones.map((m) => {
      if (m.id === selectedMilestone.id) {
        return {
          ...m,
          status: "Completed",
          pmNote: note,
          completedBy: "J. Doe",
          completedDate: new Date().toLocaleString(),
        };
      }
      return m;
    });
    setPoData({ ...poData, milestones: updatedMilestones });
    setIsConfirmModalOpen(false);
    setSelectedMilestone(null);
  };

  const handleCreateBill = (milestone: any) => {
    setSelectedMilestone(milestone);
    setIsBillModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link
          href="/invoice/purchase-order"
          className="hover:text-gray-700 transition-colors"
        >
          Home
        </Link>
        <span className="text-gray-400">{">"}</span>
        <Link
          href="/invoice/purchase-order"
          className="hover:text-gray-700 transition-colors"
        >
          Invoice
        </Link>
        <span className="text-gray-400">/</span>
        <Link
          href="/invoice/purchase-order"
          className="hover:text-gray-700 transition-colors"
        >
          Purchase Order
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{poData.id}</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-4  bg-white rounded border border-gray-200 p-6">
        <ArrowLeft />
        <h1 className="text-2xl font-semibold text-gray-900">Purchase Order</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
          Resend PO
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded border border-gray-200 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-blue-500 mb-4">
            Basic Information
          </h2>
          <span className="px-4 py-1 bg-blue-50 text-blue-500 rounded-full flex items-center gap-2">
            Issued
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Subcontractor Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poData.subcontractorName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Scope of Work
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poData.scopeOfWork}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Project Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poData.projectName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              WBS element
            </p>
            <p className="text-sm font-medium text-gray-900">{poData.wbs}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Expected Completion Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {poData.expectedCompletionDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Request type
            </p>
            <p className="text-sm font-medium text-gray-900 py-1">
              <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded-full">
                {poData.requestType}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Type and Contract Values */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-4">
        <div className="bg-white rounded border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Payment Type
          </p>
          <p className="text-sm font-medium text-gray-900 py-1">
            <span className="px-2 py-1 bg-blue-50 text-blue-500 rounded-full">
              {poData.paymentType}
            </span>
          </p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Contract Value
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(poData.contractValue)}
          </p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Committed
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(poData.committed)}
          </p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Actual (Paid)
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(poData.actualPaid)}
          </p>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden mb-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-700">Milestones</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {poData.milestones.map((milestone) => (
            <div key={milestone.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {milestone.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getMilestoneStatusColor(milestone.status)}`}
                    >
                      {getMilestoneStatusIcon(milestone.status)}
                      {milestone.status}
                    </span>
                  </div>
                  {milestone.status === "Completed" && milestone.pmNote && (
                    <div className="bg-green-50 text-green-500 rounded-md p-4 mb-4">
                      <p className="text-xs font-medium text-green-700 mb-1">
                        PM Completion Record
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        {milestone.completedBy} · {milestone.completedDate}
                      </p>
                      <p className="text-sm text-gray-700 italic">
                        "{milestone.pmNote}"
                      </p>
                    </div>
                  )}
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {milestone.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(milestone.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {milestone.status === "Completed" && (
                    <button
                      onClick={() => handleCreateBill(milestone)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      Create Bill
                    </button>
                  )}
                  {milestone.status === "In progress" && (
                    <button
                      onClick={() => handleMarkComplete(milestone)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <PMCompletionRecord />

      {/* Modals */}
      <CreateSubcontractorBillModal
        isOpen={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setSelectedMilestone(null);
        }}
        poId={poData.id}
        subcontractorName={poData.subcontractorName}
        wbs={poData.wbs}
        costCategory="SUB-001"
        milestone={selectedMilestone}
        formatCurrency={formatCurrency}
      />

      <ConfirmCompletionModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedMilestone(null);
        }}
        onConfirm={handleConfirmComplete}
        milestoneName={selectedMilestone?.name || ""}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Trash2, Edit, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";

import { 
  useGetMaterialConsumptionQuery, 
  useUpdateMaterialConsumptionMutation,
  useDeleteMaterialConsumptionMutation,
  useSubmitMaterialConsumptionRequestMutation,
  useReleaseMaterialConsumptionMutation
} from "@/api/requests/materialConsumptionRequestApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function MaterialConsumptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reqId = (params?.id as string) || "";
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [releaseQuantities, setReleaseQuantities] = useState<Record<string, string>>({});
  
  const { data: apiData, isLoading, isError, refetch } = useGetMaterialConsumptionQuery(Number(reqId), {
    skip: !reqId || isNaN(Number(reqId)),
  });

  const [updateStatus] = useUpdateMaterialConsumptionMutation();
  const [deleteRequest, { isLoading: isDeleting }] = useDeleteMaterialConsumptionMutation();
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitMaterialConsumptionRequestMutation();
  const [releaseMaterial, { isLoading: isReleasing }] = useReleaseMaterialConsumptionMutation();

  const req: any = React.useMemo(() => {
    if (!apiData) return null;
    
    // Map missing backend fields gracefully to avoid runtime crashes
    return {
      id: apiData.request_id || `MCR-${apiData.id}`,
      project: (apiData as any).project_details?.name || `Project #${apiData.project_request || 'Unknown'}`,
      wbsPhase: (apiData as any).phase_details?.name || "Unknown Phase",
      wbsActivity: (apiData as any).activity_details?.name || "Unknown Activity",
      equipmentId: (apiData as any).equipment_details?.name || "-",
      requester: (apiData as any).created_by_name || (apiData as any).requester_details?.name || "-",
      gateReceiver: (apiData as any).gate_receiver_details?.name || "-",
      requisitionDate: apiData.date_consumed || new Date(apiData.created_at || Date.now()).toISOString().split('T')[0],
      issueDate: (apiData as any).issue_date || "-",
      totalCost: apiData.lines?.reduce((sum: number, line: any) => sum + (parseFloat(line.total_cost) || 0), 0) || 0,
      itemsList: apiData.lines?.map((line: any) => {
        const reqQty = parseFloat(line.quantity) || 0;
        const relQty = parseFloat(line.quantity_released) || 0;
        const remQty = Math.max(0, reqQty - relQty);
        return {
          id: line.id || Math.random().toString(),
          name: line.product_details?.product_name || `Product ID: ${line.product || 'Unknown'}`,
          description: line.product_details?.description || "-",
          unit: line.product_details?.unit_of_measure_details?.unit_symbol || line.unit_of_measure_details?.unit_symbol || "Units",
          requestedQty: reqQty,
          quantityReleased: relQty,
          remainingQty: remQty,
          availableStock: line.available_stock ?? line.product_details?.available_stock ?? 0,
          unitCost: parseFloat(line.unit_cost) || 0,
        };
      }) || [],
      status: apiData.status || "pending",
      releaseStatus: (apiData as any).release_status || "PENDING",
      notes: apiData.notes || "",
      isOverrun: apiData.status === "held_overrun",
      availableBudget: (apiData as any).available_budget ? parseFloat((apiData as any).available_budget) : undefined,
      costCode: (apiData as any).cost_code || "-",
      parentRequestId: (apiData as any).project_request?.id || (apiData as any).project_request,
      location: (apiData as any).location_details?.location_name || (apiData as any).location_details?.location_code || apiData.location || "-",
    };
  }, [apiData]);

  // Set default release quantities when data loads
  React.useEffect(() => {
    if (req?.itemsList) {
      setReleaseQuantities((prev) => {
        const next = { ...prev };
        req.itemsList.forEach((item: any) => {
          if (next[item.id] === undefined) {
            const defaultQty = Math.max(0, Math.min(item.remainingQty, item.availableStock));
            next[item.id] = String(defaultQty);
          }
        });
        return next;
      });
    }
  }, [req]);

  const [reason, setReason] = useState<string>("");

  const statusModal = useStatusModal();

  const handleRelease = async () => {
    if (!req || !apiData) return;

    const linesPayload = req.itemsList.map((item: any) => {
      const val = parseFloat(String(releaseQuantities[item.id] ?? 0));
      return {
        id: item.id,
        quantity_to_release: isNaN(val) ? 0 : val,
      };
    });

    const totalToRelease = linesPayload.reduce((sum: number, l: any) => sum + l.quantity_to_release, 0);
    if (totalToRelease <= 0) {
      statusModal.showError(
        "Validation Error",
        "Please enter a quantity greater than 0 to release."
      );
      return;
    }

    for (const item of req.itemsList) {
      const releaseQty = parseFloat(String(releaseQuantities[item.id] ?? 0));
      if (releaseQty > item.availableStock) {
        statusModal.showError(
          "Insufficient Stock",
          `Cannot release ${releaseQty} for ${item.name}. Warehouse stock available is only ${item.availableStock}.`
        );
        return;
      }
      if (releaseQty > item.remainingQty) {
        statusModal.showError(
          "Exceeds Remaining Quantity",
          `Cannot release ${releaseQty} for ${item.name}. Maximum remaining to release is ${item.remainingQty}.`
        );
        return;
      }
    }

    try {
      const res: any = await releaseMaterial({
        id: Number(reqId),
        body: {
          location: apiData.location || "LAGS00001",
          date_consumed: apiData.date_consumed || new Date().toISOString().split("T")[0],
          notes: apiData.notes || "Material released from inventory.",
          lines: linesPayload,
        }
      }).unwrap();

      const isPartial = res?.release_status === "PARTIAL_RELEASE" || res?.status === "partial_release";

      statusModal.showSuccess(
        isPartial ? "Partial Release Recorded" : "Material Fully Released",
        isPartial
          ? `Material Consumption ${req.id} partially released. You can release the remaining balance when stock arrives.`
          : `Material Consumption ${req.id} released successfully.`
      );
      refetch();
    } catch (err: any) {
      statusModal.showError(
        "Action Failed",
        err.data?.error || err.data?.message || err.error || "An error occurred while releasing the material."
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(Number(reqId)).unwrap();
      setIsConfirmDeleteOpen(false);
      statusModal.showSuccess("Deleted", "Material Consumption request deleted successfully.");
      router.push("/inventory/operation/material-consumption");
    } catch (err: any) {
      statusModal.showError("Delete Failed", err.data?.message || err.error || "Failed to delete the request.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!req.parentRequestId) throw new Error("Could not find parent project request ID");
      await submitRequest({ id: req.parentRequestId }).unwrap();
      statusModal.showSuccess("Submitted", "Material Consumption request submitted successfully.");
      refetch();
    } catch (err: any) {
      statusModal.showError("Submit Failed", err.data?.message || err.error || "Failed to submit the request.");
    }
  };

  return (
    <PageGuard application="inventory" module="materialconsumption">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white relative pb-20"
      >
        {isLoading ? (
          <div className="max-w-2xl mx-auto px-4 pt-6 w-full space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <Skeleton className="h-6 bg-gray-200 rounded w-36 animate-pulse" />
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <Skeleton className="h-6 bg-gray-200 rounded-full w-20 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                    <Skeleton className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isError || !req ? (
          <div className="p-12 text-center text-red-500 font-medium">Failed to load material consumption details.</div>
        ) : (
          <>
        {/* FastraSuite Standard Clean Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center">
            <Link href="/inventory/operation/material-consumption">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-medium text-gray-800">
                Material Consumption Request: {req.id}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 text-[11px] rounded font-medium uppercase ${
                    req.status === "approved"
                      ? "bg-blue-100 text-blue-700"
                      : req.status === "released"
                      ? "bg-green-100 text-green-700"
                      : req.status === "partial_release" || req.status === "partially_released"
                      ? "bg-amber-100 text-amber-800"
                      : req.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {req.status === "partial_release" || req.status === "partially_released" ? "Partial Release" : String(req.status).replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(req.status === "approved" || req.status === "partial_release" || req.status === "partially_released") && (
              <>
                <Button
                  className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white text-xs h-9 shadow-sm"
                  onClick={handleRelease}
                  disabled={isReleasing}
                >
                  {isReleasing ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isReleasing
                    ? "Releasing..."
                    : req.status === "partial_release" || req.status === "partially_released"
                    ? "Release Remaining Material"
                    : "Release Material"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Details Content matching rest of FastraSuite */}
        <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-10">


          {/* Material Consumption Details Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-[#32325D] mb-4 pb-3 border-b border-gray-100">
              Material Consumption Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <span className="text-xs text-gray-400 block mb-1">Requisition ID</span>
                <span className="text-sm font-semibold text-gray-800">{req.id}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">Target Project</span>
                <span className="text-sm font-semibold text-[#3B7CED]">{req.project}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">WBS Phase & Activity</span>
                <span className="text-sm font-semibold text-gray-800">{req.wbsPhase} → {req.wbsActivity}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">Location</span>
                <span className="text-sm font-semibold text-gray-800">{req.location}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-1">Total Valuation</span>
                <span className="text-sm font-bold text-gray-900">₦{req.totalCost.toLocaleString()}</span>
              </div>

              {req.requester && req.requester !== "-" && req.requester !== "N/A" && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Requested By</span>
                  <span className="text-sm font-medium text-gray-800">{req.requester}</span>
                </div>
              )}
              {req.gateReceiver && req.gateReceiver !== "-" && req.gateReceiver !== "N/A" && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Gate Receiver / Signatory</span>
                  <span className="text-sm font-medium text-gray-800">{req.gateReceiver}</span>
                </div>
              )}
              {req.equipmentId && req.equipmentId !== "-" && req.equipmentId !== "N/A" && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Target Asset / Equipment</span>
                  <span className="text-sm font-medium text-amber-800">{req.equipmentId}</span>
                </div>
              )}
              {req.requisitionDate && req.requisitionDate !== "-" && req.requisitionDate !== "N/A" && (
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Requisition vs Issue Date</span>
                  <span className="text-sm font-medium text-gray-800">
                    {req.requisitionDate} {req.issueDate && req.issueDate !== "-" && req.issueDate !== "N/A" ? `→ ${req.issueDate}` : ""}
                  </span>
                </div>
              )}

              {req.notes && (
                <div className="md:col-span-5 border-t border-gray-200 pt-4 mt-2">
                  <span className="text-xs text-gray-400 block mb-1">Field Engineer Notes</span>
                  <span className="text-sm text-gray-700">{req.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Requested Material Lines Card */}
          <div className="bg-white rounded-lg shadow-2xs border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-[#32325D]">
                Requested Material Lines
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F9FA] border-b-gray-100">
                    <TableHead className="pl-4">Product Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Unit</TableHead>
                    <TableHead className="text-center">Requested QTY</TableHead>
                    {req.itemsList.some((it: any) => it.quantityReleased > 0) && (
                      <TableHead className="text-center">Already Released</TableHead>
                    )}
                    <TableHead className="text-center">Warehouse Stock</TableHead>
                    {(req.status === "approved" || req.status === "partial_release" || req.status === "partially_released") && (
                      <TableHead className="text-center w-36">QTY to Release</TableHead>
                    )}
                    <TableHead className="text-right">Unit Cost (₦)</TableHead>
                    <TableHead className="text-right">Total Line Cost (₦)</TableHead>
                    <TableHead className="pr-4 text-center">Audit Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {req.itemsList.map((item: any, idx: number) => {
                    const canEditRelease = req.status === "approved" || req.status === "partial_release" || req.status === "partially_released";
                    const isFullyReleased = item.remainingQty <= 0 && item.requestedQty > 0;
                    const enteredQty = parseFloat(String(releaseQuantities[item.id] ?? 0)) || 0;
                    const hasShortage = item.availableStock < item.remainingQty;

                    return (
                      <TableRow key={item.id || idx} className="border-b-gray-100 hover:bg-gray-50">
                        <TableCell className="pl-4 font-medium text-gray-800">{item.name}</TableCell>
                        <TableCell className="text-gray-600 text-xs">{item.description || item.name}</TableCell>
                        <TableCell className="text-center text-xs">{item.unit}</TableCell>
                        <TableCell className="text-center font-bold text-[#3B7CED]">{item.requestedQty}</TableCell>
                        {req.itemsList.some((it: any) => it.quantityReleased > 0) && (
                          <TableCell className="text-center text-sm font-semibold text-gray-600">
                            {item.quantityReleased}
                          </TableCell>
                        )}
                        <TableCell className="text-center font-bold text-gray-800">{item.availableStock}</TableCell>
                        
                        {canEditRelease && (
                          <TableCell className="text-center">
                            {isFullyReleased ? (
                              <span className="text-xs text-gray-400 font-medium">Completed</span>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                max={Math.min(item.remainingQty, item.availableStock)}
                                step="any"
                                value={releaseQuantities[item.id] ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReleaseQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: val,
                                  }));
                                }}
                                placeholder="0"
                                className="bg-white border-gray-200 rounded-md h-8 text-sm text-center font-bold text-[#3B7CED] w-24 mx-auto"
                              />
                            )}
                          </TableCell>
                        )}

                        <TableCell className="text-right text-xs text-gray-600">{item.unitCost.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-gray-900">{(item.requestedQty * item.unitCost).toLocaleString()}</TableCell>
                        <TableCell className="pr-4 text-center">
                          {isFullyReleased ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] rounded font-medium bg-green-100 text-green-700">
                              Fully Released
                            </span>
                          ) : enteredQty > 0 && enteredQty < item.remainingQty ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] rounded font-medium bg-amber-100 text-amber-800">
                              Partial ({enteredQty}/{item.remainingQty})
                            </span>
                          ) : hasShortage ? (
                            <span className="inline-block px-2 py-0.5 text-[11px] rounded font-medium bg-red-100 text-red-700">
                              Shortage
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 text-[11px] rounded font-medium bg-green-100 text-green-700">
                              Sufficient Stock
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Totals Summary */}
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex justify-end">
                <div className="w-full max-w-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Number of Items</span>
                    <span className="text-sm font-semibold text-gray-800">{req.itemsList.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-gray-700">Total Approved Cost</span>
                    <span className="text-lg font-bold text-[#32325D]">
                      ₦{req.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Bar for Draft Status */}
        {req.status === "draft" && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                onClick={() => setIsConfirmDeleteOpen(true)}
                disabled={isDeleting || isSubmitting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              
              <Button
                variant="outline"
                className="flex-1 border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 h-11"
                onClick={() => router.push(`/inventory/operation/material-consumption/edit/${reqId}`)}
                disabled={isDeleting || isSubmitting}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Button
                className="flex-[2] bg-[#3B7CED] hover:bg-blue-600 text-white h-11"
                onClick={handleSubmit}
                disabled={isDeleting || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {isConfirmDeleteOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" /> Delete Request
              </h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this material consumption request? This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        </>
        )}

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.close}
          title={statusModal.title}
          message={statusModal.message}
          type={statusModal.type}
        />
      </motion.div>
    </PageGuard>
  );
}

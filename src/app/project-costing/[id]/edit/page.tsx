"use client";

import React, { useState, useEffect, useRef, use } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Paperclip, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BasicInformationForm } from "@/components/project-costing/BasicInformationForm";
import { WBSTable } from "@/components/project-costing/wbs/WBSTable";
import { Phase, Activity } from "@/components/project-costing/types";
import {
  useGetProjectCostingProjectQuery,
  usePatchProjectCostingProjectMutation,
  useSubmitProjectMutation,
  useAddProjectDocumentMutation,
  useUpdatePhaseBundleMutation,
} from "@/api/projectCostingApi";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { extractErrorMessage } from "@/lib/utils";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleWizard } from "@/components/shared/wizard/ModuleWizard";
import { ToastNotification } from "@/components/shared/ToastNotification";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const projectId = Number(resolvedParams.id);

  const { data: project, isLoading: isProjectLoading, error: projectError } = useGetProjectCostingProjectQuery(projectId);

  // Basic Information States
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectType, setProjectType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [siteLocation, setSiteLocation] = useState("");

  // WBS Table States
  const [phases, setPhases] = useState<Phase[]>([]);
  const [extraColumns, setExtraColumns] = useState<string[]>([]);

  // External Documents States
  const [documents, setDocuments] = useState<{ name: string; url?: string; file?: File }[]>([]);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patchProject, { isLoading: isPatching }] = usePatchProjectCostingProjectMutation();
  const [submitProject, { isLoading: isSubmittingPending }] = useSubmitProjectMutation();
  const [updatePhaseBundle] = useUpdatePhaseBundleMutation();
  const [addProjectDocument] = useAddProjectDocumentMutation();
  const statusModal = useStatusModal();

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const wbsFileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState("");
  const [isDraggingWbs, setIsDraggingWbs] = useState(false);

  // Populate form with existing project data once loaded
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setClientName(project.client_name || "");
      setProjectType(project.project_type || "");
      setStartDate(project.start_date || "");
      setExpectedEndDate(project.expected_end_date || "");
      setDescription(project.description || "");
      setSiteLocation(project.site_location || "");

      // Parse phases
      if (project.phases) {
        try {
          const parsedPhases = typeof project.phases === "string" ? JSON.parse(project.phases) : project.phases;
          if (Array.isArray(parsedPhases)) {
            const formattedPhases: Phase[] = parsedPhases.map((p: any, pIdx: number) => ({
              id: String(p.id || `phase-${pIdx + 1}`),
              name: p.name || `Phase ${pIdx + 1}`,
              activities: Array.isArray(p.activities)
                ? p.activities.map((a: any, aIdx: number) => {
                    const actObj: Activity = {
                      id: String(a.id || `act-${aIdx + 1}`),
                      sn: a.sn || a.serial_number || `${pIdx + 1}.${aIdx + 1}`,
                      name: a.name || "",
                      quantity: Number(a.quantity) || 1,
                      rate: Number(a.rate || (Number(a.amount || 0) / Number(a.quantity || 1))) || 0,
                      budget: Number(a.current_budget || a.amount || 0),
                    };
                    // Extract extra custom columns
                    const standardKeys = new Set(["id", "sn", "serial_number", "name", "quantity", "rate", "budget", "amount", "current_budget"]);
                    Object.keys(a).forEach((k) => {
                      if (!standardKeys.has(k)) {
                        (actObj as any)[k] = a[k];
                      }
                    });
                    return actObj;
                  })
                : [],
            }));
            setPhases(formattedPhases);

            // Extract custom columns
            const colSet = new Set<string>();
            formattedPhases.forEach((p) => {
              p.activities.forEach((act) => {
                const standardKeys = new Set(["id", "sn", "name", "quantity", "rate", "budget"]);
                Object.keys(act).forEach((k) => {
                  if (!standardKeys.has(k)) colSet.add(k);
                });
              });
            });
            setExtraColumns(Array.from(colSet));
          }
        } catch (err) {
          console.error("Failed to parse project phases:", err);
        }
      }

      // Populate existing documents
      if (project.documents && Array.isArray(project.documents)) {
        setDocuments(project.documents.map((doc: any) => ({
          name: doc.name || doc.file_name || "Attachment",
          url: doc.url || doc.file || doc.document_url,
        })));
      }
    }
  }, [project]);

  const isProcessing = isSubmitting || isPatching || isSubmittingPending;

  // Handler for adding a URL Link
  const handleAddLink = () => {
    const nameTrim = linkName.trim();
    let urlTrim = linkUrl.trim();
    if (!nameTrim || !urlTrim) return;

    if (!/^https?:\/\//i.test(urlTrim)) {
      urlTrim = `https://${urlTrim}`;
    }

    setDocuments((prev) => [...prev, { name: nameTrim, url: urlTrim }]);
    setLinkName("");
    setLinkUrl("");
  };

  // Handler for uploading files (External Documents)
  const handleFileUploadExternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newDocs = Array.from(files).map((f) => ({
      name: f.name,
      file: f,
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  // Handler for removing a document or link
  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler for importing WBS Excel sheet
  const processWBSFile = (file: File) => {
    setImportedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const sheetData = XLSX.utils.sheet_to_json<any>(ws);

        if (!sheetData || sheetData.length === 0) {
          statusModal.showError("Invalid File", "The uploaded Excel file is empty.");
          return;
        }

        const range = XLSX.utils.decode_range(ws["!ref"] || "");
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          let val = "";
          if (cell && cell.t) val = XLSX.utils.format_cell(cell);
          headers.push(val.trim());
        }

        const normalizedHeaders = headers.map((h) => h.toLowerCase());
        const mandatory = ["s/n", "phase", "activity", "quantity", "rate", "amount"];
        const missing = mandatory.filter((m) => !normalizedHeaders.includes(m));

        if (missing.length > 0) {
          statusModal.showError(
            "Invalid Format",
            `The Excel file is missing mandatory columns: ${missing.map((m) => `"${m.toUpperCase()}"`).join(", ")}`
          );
          return;
        }

        const isSnCol = (h: string) => ["s/n", "sn", "serial", "serial number", "serial_number", "serial no", "serial_no"].includes(h.toLowerCase().trim());
        const isPhaseCol = (h: string) => ["phase", "phase name", "phase_name"].includes(h.toLowerCase().trim());
        const isActivityCol = (h: string) => ["activity", "activity name", "activity_name", "name"].includes(h.toLowerCase().trim());
        const isQuantityCol = (h: string) => ["quantity", "qty"].includes(h.toLowerCase().trim());
        const isRateCol = (h: string) => ["rate", "unit rate", "unit_rate"].includes(h.toLowerCase().trim());
        const isAmountCol = (h: string) => ["amount", "budget", "total amount", "total_amount"].includes(h.toLowerCase().trim());

        const isStandardCol = (h: string) =>
          isSnCol(h) || isPhaseCol(h) || isActivityCol(h) || isQuantityCol(h) || isRateCol(h) || isAmountCol(h);

        const extraCols = headers.filter((h) => h && !isStandardCol(h));
        setExtraColumns(extraCols);

        const headerToKey = (headerName: string) => {
          const lower = headerName.toLowerCase().trim();
          if (isSnCol(lower)) return "sn";
          if (isPhaseCol(lower)) return "phase";
          if (isActivityCol(lower)) return "name";
          if (isQuantityCol(lower)) return "quantity";
          if (isRateCol(lower)) return "rate";
          if (isAmountCol(lower)) return "budget";
          return headerName;
        };

        const newPhases: Phase[] = [];
        const generateId = () => Math.random().toString(36).substr(2, 9);

        sheetData.forEach((row) => {
          const rowObj: any = {};
          Object.keys(row).forEach((rawKey) => {
            const matchedHeader = headers.find(
              (h) => h.toLowerCase() === rawKey.toLowerCase().trim()
            );
            if (matchedHeader) {
              const mappedKey = headerToKey(matchedHeader);
              let val = row[rawKey];
              if (["quantity", "rate", "budget"].includes(mappedKey)) {
                val = Number(val) || 0;
              }
              rowObj[mappedKey] = val;
            }
          });

          const phaseName = String(rowObj.phase || "").trim();
          const activityName = String(rowObj.name || "").trim();
          const sn = String(rowObj.sn || "").trim();
          const quantity = Number(rowObj.quantity) || 1;
          const rate = Number(rowObj.rate) || 0;
          const budget = Number(rowObj.budget) || (quantity * rate);

          if (!phaseName || !activityName) return;

          let phase = newPhases.find((p) => p.name === phaseName);
          if (!phase) {
            phase = { id: generateId(), name: phaseName, activities: [] };
            newPhases.push(phase);
          }

          const extraFields: any = {};
          extraCols.forEach((col) => {
            extraFields[col] = rowObj[col] !== undefined ? String(rowObj[col]) : "";
          });

          const activityObj: Activity = {
            id: generateId(),
            sn,
            name: activityName,
            quantity,
            rate,
            budget,
            ...extraFields,
          };

          phase.activities.push(activityObj);
        });

        setPhases(newPhases);
        const totalActs = newPhases.reduce((acc, p) => acc + (p.activities?.length || 0), 0);
        setToast({
          show: true,
          message: `WBS imported successfully (${newPhases.length} phase${newPhases.length === 1 ? "" : "s"}, ${totalActs} activit${totalActs === 1 ? "y" : "ies"} loaded).`,
          type: "success",
        });
      } catch (err) {
        console.error(err);
        setToast({
          show: true,
          message: "Error reading the Excel file. Please ensure it is a valid format.",
          type: "error",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleWBSImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processWBSFile(file);
    if (wbsFileInputRef.current) {
      wbsFileInputRef.current.value = "";
    }
  };

  const handleDragOverWbs = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingWbs(true);
  };

  const handleDragLeaveWbs = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingWbs(false);
  };

  const handleDropWbs = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingWbs(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      processWBSFile(file);
    } else if (file) {
      statusModal.showError("Invalid File", "Please drop a valid Excel file (.xlsx or .xls)");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["S/N", "Phase", "Activity", "Quantity", "Rate", "Amount"];
    const sampleData = [
      {
        "S/N": "1.1",
        "Phase": "Phase 1: Mobilization",
        "Activity": "Site Clearing and Fencing",
        "Quantity": 1,
        "Rate": 500000,
        "Amount": 500000,
      },
      {
        "S/N": "1.2",
        "Phase": "Phase 1: Mobilization",
        "Activity": "Equipment Transport",
        "Quantity": 2,
        "Rate": 250000,
        "Amount": 500000,
      },
      {
        "S/N": "2.1",
        "Phase": "Phase 2: Foundation",
        "Activity": "Excavation work",
        "Quantity": 1,
        "Rate": 1200000,
        "Amount": 1200000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "WBS Template");
    XLSX.writeFile(workbook, "wbs_import_template.xlsx");
  };

  const handleSubmit = async (isSubmitForApproval = false) => {
    if (isProcessing) return;

    if (!name || !clientName) {
      statusModal.showError(
        "Missing Information",
        "Project Name and Client Name are required. Please fill in these fields before saving."
      );
      return;
    }

    setIsSubmitting(true);

    const phasesPayload = phases.map((phase) => ({
      name: phase.name,
      activities: phase.activities.map((a) => {
        const payloadAct: any = {
          name: a.name,
          amount: a.budget || 0,
          quantity: a.quantity || 1,
          rate: a.rate || a.budget || 0,
        };
        extraColumns.forEach((col) => {
          if ((a as any)[col] !== undefined) {
            payloadAct[col] = (a as any)[col];
          }
        });
        if (a.sn) {
          payloadAct.sn = a.sn;
        }
        return payloadAct;
      }),
    }));

    try {
      const payload = {
        name,
        client_name: clientName,
        project_type: projectType,
        start_date: startDate || new Date().toISOString().split("T")[0],
        expected_end_date: expectedEndDate || new Date().toISOString().split("T")[0],
        description,
        site_location: siteLocation,
        phases: phasesPayload,
      } as any;

      // Update project core data
      await patchProject({ id: projectId, body: payload }).unwrap();

      // Update WBS phases specifically if endpoint exists
      try {
        await updatePhaseBundle({ id: projectId, body: { phases: phasesPayload } }).unwrap();
      } catch (phaseErr) {
        console.warn("Phase bundle update note:", phaseErr);
      }

      // If user clicked Submit for Approval
      if (isSubmitForApproval) {
        await submitProject({ id: projectId }).unwrap();
      }

      // Upload new documents if added
      const newFilesToUpload = documents.filter((d) => d.file);
      if (newFilesToUpload.length > 0) {
        for (const doc of newFilesToUpload) {
          if (doc.file) {
            const formData = new FormData();
            formData.append("file", doc.file);
            formData.append("name", doc.file.name);
            formData.append("document_type", "FILE");
            try {
              await addProjectDocument({ id: projectId, body: formData }).unwrap();
            } catch (docErr) {
              console.error("Failed to upload document:", doc.name, docErr);
            }
          }
        }
      }

      if (isSubmitForApproval) {
        statusModal.showSuccess(
          "Project Submitted for Approval",
          `Project "${name}" has been updated and submitted for approval.`
        );
      } else {
        statusModal.showSuccess(
          "Changes Saved",
          `Project "${name}" has been updated successfully.`
        );
      }
    } catch (err: any) {
      statusModal.showError(
        isSubmitForApproval ? "Submission Failed" : "Update Failed",
        extractErrorMessage(
          err,
          "There was an error updating your project costing. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalAction = () => {
    const isSuccess =
      statusModal.title === "Project Submitted for Approval" ||
      statusModal.title === "Changes Saved";
    statusModal.close();
    if (isSuccess) {
      router.push(`/project-costing/${projectId}`);
    }
  };

  if (isProjectLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-white p-8 gap-6">
        <Skeleton className="h-8 w-48 bg-gray-200" />
        <Skeleton className="h-64 w-full bg-gray-100 rounded-xl" />
        <Skeleton className="h-96 w-full bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-6">
        <p className="text-red-500 text-sm mb-4">Failed to load project details for editing.</p>
        <Link href="/project-costing">
          <Button className="bg-[#3B7CED] text-white">Back to Project Costing</Button>
        </Link>
      </div>
    );
  }

  return (
    <PageGuard module="project_costing" entitlement="create_project">
      <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white relative pb-20 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center">
            <Link href={`/project-costing/${projectId}`}>
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5 text-gray-500" />
              </Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-lg font-medium text-gray-800">Edit Project Costing</h1>
              <span className="text-xs text-gray-400">{project.project_code || `#${projectId}`}</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            variant="outline"
            className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 flex items-center gap-2 h-9 text-xs"
          >
            <Paperclip className="w-4 h-4" />
            <span>Documents & Links ({documents.length})</span>
          </Button>
        </div>

        {/* Content Container */}
        <div className="flex-1 px-6 py-6 max-w-[1400px] mx-auto w-full flex flex-col gap-8">
          {/* Section 1: Basic Information */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              1. Basic Information
            </h2>
            <BasicInformationForm
              name={name}
              setName={setName}
              clientName={clientName}
              setClientName={setClientName}
              projectType={projectType}
              setProjectType={setProjectType}
              startDate={startDate}
              setStartDate={setStartDate}
              expectedEndDate={expectedEndDate}
              setExpectedEndDate={setExpectedEndDate}
              description={description}
              setDescription={setDescription}
              siteLocation={siteLocation}
              setSiteLocation={setSiteLocation}
            />
          </div>

          {/* Section 2: Work Breakdown Structure (WBS) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                2. Work Breakdown Structure (WBS)
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-8 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Download Sample Excel Template</span>
              </Button>
            </div>

            {/* Drag and Drop Excel Import Box */}
            <div
              onDragOver={handleDragOverWbs}
              onDragLeave={handleDragLeaveWbs}
              onDrop={handleDropWbs}
              className={`p-4 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-center ${
                isDraggingWbs
                  ? "border-[#3B7CED] bg-blue-50/50"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
              }`}
            >
              <Input
                ref={wbsFileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleWBSImport}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => wbsFileInputRef.current?.click()}
                  className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 text-xs h-8"
                >
                  Import WBS Excel
                </Button>
                <span className="text-xs text-gray-500">
                  or drag and drop your WBS spreadsheet here
                </span>
              </div>
              {importedFileName && (
                <span className="text-xs font-medium text-emerald-600">
                  Loaded file: {importedFileName}
                </span>
              )}
            </div>

            <WBSTable
              phases={phases}
              setPhases={setPhases}
              extraColumns={extraColumns}
              setExtraColumns={setExtraColumns}
            />
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-8 py-3.5 flex justify-end items-center gap-3 z-30 shadow-md">
          <Link href={`/project-costing/${projectId}`}>
            <Button
              variant="outline"
              type="button"
              disabled={isProcessing}
              className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-9 px-5"
            >
              Cancel
            </Button>
          </Link>

          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isProcessing}
            variant="outline"
            className="border-[#3B7CED] text-[#3B7CED] hover:bg-blue-50 text-xs h-9 px-5 font-medium"
          >
            {isPatching && !isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>

          {(!project.status || project.status === "DRAFT") && (
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isProcessing}
              className="bg-[#3B7CED] hover:bg-[#3065c3] text-white text-xs h-9 px-5 font-medium"
            >
              {isSubmittingPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          )}
        </div>

        {/* External Documents Side Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPanelOpen(false)}
                className="fixed inset-0 bg-black z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col"
              >
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-[#3B7CED]" />
                    <h3 className="font-semibold text-gray-800 text-sm">External Documents & Links</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPanelOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                  {/* File Upload Box */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Attach Document Files</label>
                    <label className="border-2 border-dashed border-gray-200 hover:border-[#3B7CED] bg-gray-50/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Paperclip className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600 font-medium">Click to select files</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Supports PDF, DOCX, XLSX, Images</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUploadExternal}
                      />
                    </label>
                  </div>

                  {/* Add Web Link Box */}
                  <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <label className="text-xs font-semibold text-gray-700">Add External Web Link</label>
                    <Input
                      placeholder="Link Name (e.g. Google Drive Spec Sheet)"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Input
                      placeholder="URL (e.g. https://docs.google.com/...)"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkName.trim() || !linkUrl.trim()}
                      className="bg-[#3B7CED] hover:bg-[#3065c3] text-white text-xs h-8"
                    >
                      Add Link
                    </Button>
                  </div>

                  {/* Documents List */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Attached Documents ({documents.length})
                    </label>
                    {documents.length === 0 ? (
                      <div className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg">
                        No external documents or links added yet.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <Paperclip className="w-3.5 h-3.5 text-[#3B7CED] shrink-0" />
                              <span className="text-xs font-medium text-gray-700 truncate">{doc.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDocument(idx)}
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <Button
                    type="button"
                    onClick={() => setIsPanelOpen(false)}
                    className="w-full bg-[#3B7CED] hover:bg-[#3065c3] text-white text-xs h-9"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={handleModalAction}
          title={statusModal.title}
          message={statusModal.message}
          type={statusModal.type}
          actionText={statusModal.actionText}
          onAction={handleModalAction}
        />

        {toast.show && (
          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />
        )}

        <ModuleWizard moduleId="project-costing" />
      </div>
    </PageGuard>
  );
}

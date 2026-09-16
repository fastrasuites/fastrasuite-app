"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Plus, Paperclip, Link2, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BasicInformationForm } from "@/components/project-costing/BasicInformationForm";
import { WBSTable } from "@/components/project-costing/wbs/WBSTable";
import { Phase, Activity } from "@/components/project-costing/types";
import {
  useCreateProjectCostingProjectMutation,
  useCreatePendingProjectCostingProjectMutation,
  useAddProjectDocumentMutation,
} from "@/api/projectCostingApi";
import { StatusModal, useStatusModal } from "@/components/shared/StatusModal";
import { extractErrorMessage } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageGuard } from "@/components/auth/PageGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleWizard } from "@/components/shared/wizard/ModuleWizard";
import { ToastNotification } from "@/components/shared/ToastNotification";

export default function NewProjectPage() {
  const router = useRouter();

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
  const [createProject, { isLoading: isSavingDraft }] = useCreateProjectCostingProjectMutation();
  const [createPendingProject, { isLoading: isSubmittingPending }] = useCreatePendingProjectCostingProjectMutation();
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

  const isProcessing = isSubmitting || isSavingDraft || isSubmittingPending;

  const wbsFileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState("");
  const [isDraggingWbs, setIsDraggingWbs] = useState(false);

  // Handler for adding a URL Link
  const handleAddLink = () => {
    const nameTrim = linkName.trim();
    let urlTrim = linkUrl.trim();
    if (!nameTrim || !urlTrim) return;

    // Standardize URL schema
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

        // Get headers of first row to inspect headers correctly
        const range = XLSX.utils.decode_range(ws["!ref"] || "");
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          let val = "";
          if (cell && cell.t) val = XLSX.utils.format_cell(cell);
          headers.push(val.trim());
        }

        // Validate the 6 mandatory columns (case-insensitive checks)
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

        // Identify extra columns (exclude all standard columns including serial number variations)
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

        // Map column header name to matching state keys
        const headerToKey = (headerName: string) => {
          const lower = headerName.toLowerCase().trim();
          if (isSnCol(lower)) return "sn";
          if (isPhaseCol(lower)) return "phase";
          if (isActivityCol(lower)) return "name";
          if (isQuantityCol(lower)) return "quantity";
          if (isRateCol(lower)) return "rate";
          if (isAmountCol(lower)) return "budget";
          return headerName; // custom column name
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

          // Gather custom fields
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
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
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
        "Amount": 500000
      },
      {
        "S/N": "1.2",
        "Phase": "Phase 1: Mobilization",
        "Activity": "Equipment Transport",
        "Quantity": 2,
        "Rate": 250000,
        "Amount": 500000
      },
      {
        "S/N": "2.1",
        "Phase": "Phase 2: Foundation",
        "Activity": "Excavation work",
        "Quantity": 1,
        "Rate": 1200000,
        "Amount": 1200000
      }
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
        "Project Name and Client Name are required. Please fill in these fields before submitting."
      );
      return;
    }

    setIsSubmitting(true);

    // Map Phase structure to backend schema
    const phasesPayload = phases.map((phase) => ({
      name: phase.name,
      activities: phase.activities.map((a) => {
        const payloadAct: any = {
          name: a.name,
          amount: a.budget || 0,
          quantity: a.quantity || 1,
          rate: a.rate || a.budget || 0,
        };
        // Add dynamic columns
        extraColumns.forEach((col) => {
          if (a[col] !== undefined) {
            payloadAct[col] = a[col];
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

      const res = isSubmitForApproval
        ? await createPendingProject(payload).unwrap()
        : await createProject(payload).unwrap();

      const newProjectId = res.id;
      const failedDocs: { name: string; error: string }[] = [];

      // Upload documents if any
      if (documents.length > 0 && newProjectId) {
        // We will loop and upload sequentially to avoid overwhelming the server
        for (const doc of documents) {
          const formData = new FormData();
          if (doc.file) {
            formData.append("file", doc.file);
            formData.append("name", doc.file.name);
            formData.append("document_type", "FILE");
          } else if (doc.url) {
            // For links, some backends accept URL in a specific field, we'll try sending it as a text field
            formData.append("url", doc.url);
            formData.append("name", doc.name);
            formData.append("document_type", "LINK");
          }
          
          try {
            await addProjectDocument({ id: newProjectId, body: formData }).unwrap();
          } catch (docErr: any) {
            console.error("Failed to upload document:", doc.name, docErr);
            const errMsg = extractErrorMessage(docErr, "Upload failed");
            failedDocs.push({
              name: doc.name || (doc.file ? doc.file.name : "Document"),
              error: errMsg,
            });
          }
        }
      }

      if (failedDocs.length > 0) {
        const actionVerb = isSubmitForApproval
          ? "created and submitted for approval"
          : "saved as draft";
        const docCount = failedDocs.length;
        const totalCount = documents.length;
        const failureList = failedDocs
          .map((f) => `• ${f.name}: ${f.error}`)
          .join("\n");

        statusModal.showWarning(
          "Project Created with Document Upload Issues",
          `Your project "${name}" has been ${actionVerb} successfully.\n\nHowever, ${docCount} of ${totalCount} document${totalCount > 1 ? "s" : ""} failed to upload:\n\n${failureList}\n\nYou can re-upload these documents directly from the project details page.`,
          "Continue to Projects"
        );
      } else if (isSubmitForApproval) {
        statusModal.showSuccess(
          "Project Submitted for Approval",
          `Your project "${name}" has been created and submitted for approval.`
        );
      } else {
        statusModal.showSuccess(
          "Project Saved as Draft",
          `Your project "${name}" has been created and saved as a draft.`
        );
      }
    } catch (err: any) {
      statusModal.showError(
        isSubmitForApproval ? "Submission Failed" : "Project Creation Failed",
        extractErrorMessage(
          err,
          "There was an error creating your project. Please check your inputs and try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalAction = () => {
    const isProjectCreated =
      statusModal.title === "Project Submitted for Approval" ||
      statusModal.title === "Project Saved as Draft" ||
      statusModal.title === "Project Created Successfully" ||
      statusModal.title === "Project Created with Document Upload Issues";
    statusModal.close();
    if (
      (statusModal.type === "success" || statusModal.type === "warning") &&
      isProjectCreated
    ) {
      router.push("/project-costing");
    }
  };

  return (
    <PageGuard module="project_costing" entitlement="create_project">
    <div className="flex flex-col flex-1 min-h-[calc(100vh-64px)] bg-white relative pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center">
          <Link href="/project-costing">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <h1 className="text-lg font-medium text-gray-800">New Project</h1>
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

      <div className="p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-10 overflow-y-auto">
        <div data-wizard="pc-basic-info">
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

        {/* WBS Excel Import Section */}
        <section data-wizard="pc-wbs-section">
          <h2 className="text-[#3B7CED] text-base font-medium mb-4">
            Documents (WBS Excel Import)
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={wbsFileInputRef}
              onChange={handleWBSImport}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => wbsFileInputRef.current?.click()}
                    onDragOver={handleDragOverWbs}
                    onDragLeave={handleDragLeaveWbs}
                    onDrop={handleDropWbs}
                    className={`flex items-center justify-center gap-2 px-6 py-6 border-2 border-dashed rounded transition-colors cursor-pointer ${
                      isDraggingWbs 
                        ? "border-blue-500 bg-blue-50 text-blue-600" 
                        : "border-[#3B7CED] opacity-80 text-[#3B7CED] hover:bg-blue-50"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isDraggingWbs ? "Drop Excel File Here" : "Import WBS Excel (Drag & Drop)"}
                    </span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs border border-gray-800 max-w-xs z-50">
                  <p className="font-semibold mb-1">Mandatory WBS Columns:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 font-normal text-gray-200">
                    <li>S/N</li>
                    <li>Phase</li>
                    <li>Activity</li>
                    <li>Quantity</li>
                    <li>Rate</li>
                    <li>Amount</li>
                  </ol>
                  <p className="mt-1.5 text-[10px] text-gray-400">* Additional columns will be imported as custom text fields.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center gap-2 px-6 py-6 border border-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download WBS Template</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs border border-gray-800 max-w-xs z-50">
                  <p className="font-semibold mb-1">Download Excel template</p>
                  <p className="font-normal text-gray-200">Get a sample Excel file formatted correctly for importing.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {importedFileName && (
              <div className="text-xs text-gray-600 flex items-center gap-1.5 bg-blue-50/50 px-3 py-3 rounded border border-blue-100">
                <span className="font-semibold text-gray-800">Imported WBS:</span>
                <span className="truncate max-w-[150px]">{importedFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setImportedFileName("");
                    setPhases([]);
                    setExtraColumns([]);
                  }}
                  className="text-gray-400 hover:text-red-500 font-bold text-sm ml-1"
                  title="Clear imported WBS"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </section>

        <WBSTable
          phases={phases}
          setPhases={setPhases}
          extraColumns={extraColumns}
          setExtraColumns={setExtraColumns}
        />
      </div>

      {/* Footer sticky bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isProcessing}
          className="border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
        >
          {isSavingDraft && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span>{isSavingDraft ? "Saving Draft..." : "Save as Draft"}</span>
        </Button>
        <Button
          type="button"
          data-wizard="pc-submit-button"
          onClick={() => handleSubmit(true)}
          disabled={isProcessing}
          className="bg-[#3B7CED] hover:bg-[#3065c3] text-white flex items-center gap-2 shadow-2xs"
        >
          {isSubmittingPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isSubmittingPending ? "Submitting..." : "Submit for Approval"}</span>
        </Button>
      </div>

      {/* Side Over Panel / Drawer */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setIsPanelOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-[460px] max-w-[90vw] bg-white shadow-2xl border-l border-gray-100 flex flex-col"
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-[#3B7CED] text-lg font-medium">Documents & Links</h2>
                  <p className="text-xs text-gray-500 mt-1">Manage files and links for this project.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xl p-1"
                >
                  ×
                </button>
              </div>

              {/* Panel Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
                {/* File Upload Section */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-gray-700 font-medium">Upload Files</h3>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="external-doc-upload"
                    onChange={handleFileUploadExternal}
                  />
                  <label
                    htmlFor="external-doc-upload"
                    className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded hover:border-[#3B7CED] hover:bg-blue-50/20 transition-all cursor-pointer text-gray-500 hover:text-[#3B7CED] text-sm font-medium"
                  >
                    <Paperclip className="w-4 h-4" />
                    Click to select files
                  </label>
                </div>

                {/* Link Attachment Section */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-gray-700 font-medium">Attach Web Link</h3>
                  <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded border border-gray-100">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 font-medium">Link Label</label>
                      <Input
                        placeholder="e.g. Bill of Quantities (BOQ)"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 font-medium">Link URL</label>
                      <Input
                        placeholder="https://example.com/prd"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="h-9 bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddLink}
                      className="bg-[#3B7CED] hover:bg-[#3065c3] text-white h-9 mt-2 flex items-center gap-1"
                    >
                      <Link2 className="w-4 h-4" /> Attach Link
                    </Button>
                  </div>
                </div>

                {/* List of Attachments */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-gray-700 font-medium">Currently Attached</h3>
                  {documents.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-100 rounded">
                      No documents or links attached yet.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                      {documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center px-3 py-2 text-sm text-gray-700 font-normal"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {doc.url ? (
                              <Link2 className="w-4 h-4 text-[#3B7CED] shrink-0" />
                            ) : (
                              <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3B7CED] hover:underline truncate"
                              >
                                {doc.name}
                              </a>
                            ) : (
                              <span className="truncate">{doc.name}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(idx)}
                            className="text-gray-400 hover:text-red-500 shrink-0 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="bg-[#3B7CED] hover:bg-[#3065c3] text-white w-full"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={statusModal.close}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        actionText={
          statusModal.actionText ||
          (statusModal.type === "success" || statusModal.type === "warning"
            ? "Done"
            : "Try again")
        }
        onAction={handleModalAction}
        showCloseButton={false}
      />
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
      <ModuleWizard moduleId="project-costing" />
    </div>
    </PageGuard>
  );
}

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStatusModal } from "@/components/shared/StatusModal";
import { useAddProjectDocumentMutation } from "@/api/projectCostingApi";
import { Loader2, Link2, Paperclip, X } from "lucide-react";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

export function AddDocumentModal({ isOpen, onClose, projectId }: AddDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "link">("file");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusModal = useStatusModal();
  const [addProjectDocument, { isLoading }] = useAddProjectDocumentMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) setName(selected.name);
    }
  };

  const handleReset = () => {
    setName("");
    setUrl("");
    setFile(null);
    setActiveTab("file");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      statusModal.showError("Validation Error", "Please provide a name for the document.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());

    if (activeTab === "file") {
      if (!file) {
        statusModal.showError("Validation Error", "Please select a file to upload.");
        return;
      }
      formData.append("file", file);
      formData.append("document_type", "FILE");
    } else {
      if (!url.trim()) {
        statusModal.showError("Validation Error", "Please provide a valid URL.");
        return;
      }
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      formData.append("url", finalUrl);
      formData.append("document_type", "LINK");
    }

    try {
      await addProjectDocument({ id: projectId, body: formData }).unwrap();
      statusModal.showSuccess("Success", "Document added successfully.");
      handleReset();
      onClose();
    } catch (err) {
      console.error(err);
      statusModal.showError("Upload Failed", "Failed to add document. Ensure it meets requirements.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-gray-800">Add Document or Link</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
          <button
            className={`pb-2 text-sm font-medium ${
              activeTab === "file" ? "text-[#3B7CED] border-b-2 border-[#3B7CED]" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("file")}
          >
            Upload File
          </button>
          <button
            className={`pb-2 text-sm font-medium ${
              activeTab === "link" ? "text-[#3B7CED] border-b-2 border-[#3B7CED]" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("link")}
          >
            Attach Link
          </button>
        </div>

        <div className="flex flex-col gap-5 py-2">
          {activeTab === "file" ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="file" className="text-sm text-gray-700">File</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-[#3B7CED] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-full text-[#3B7CED]">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-full text-gray-500">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Click to select a file</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="url" className="text-sm text-gray-700">URL / Web Link</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="url"
                  placeholder="e.g. www.google.com/drive/folder"
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm text-gray-700">Name / Label</Label>
            <Input
              id="name"
              placeholder={activeTab === "file" ? "e.g. Approved Plan" : "e.g. Google Drive Link"}
              className="bg-gray-50 border-gray-200 focus:bg-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="border-gray-200 text-gray-600">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[#3B7CED] hover:bg-[#3065c3] text-white">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {activeTab === "file" ? "Upload File" : "Save Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

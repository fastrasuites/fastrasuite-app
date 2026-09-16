"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, Info, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusModal, StatusType } from "@/components/shared/StatusModal";

export default function ModalPreviewPage() {
  const router = useRouter();

  // Active status modal configuration
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: StatusType;
    title: string;
    message: string;
    actionText?: string;
    secondaryText?: string;
    showCloseButton: boolean;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    showCloseButton: true,
  });

  // Custom playground states
  const [customType, setCustomType] = useState<StatusType>("success");
  const [customTitle, setCustomTitle] = useState("Custom Success Title");
  const [customMessage, setCustomMessage] = useState("This is a custom status message you can edit in the fields below.");
  const [customActionText, setCustomActionText] = useState("Done");
  const [customSecondaryText, setCustomSecondaryText] = useState("Cancel");
  const [hasSecondary, setHasSecondary] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(true);

  const openModal = (
    type: StatusType,
    title: string,
    message: string,
    actionText?: string,
    secondaryText?: string
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      title,
      message,
      actionText,
      secondaryText,
      showCloseButton: showCloseBtn,
    });
  };

  const handleClose = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      {/* Header bar */}
      <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-30 shadow-none">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Status Modals Preview Sandbox</h1>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            UI Testing
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Intro */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Interactive Modals Preview</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Click any button below to display the corresponding `StatusModal` instance. The designs match the mockups exactly, featuring left-aligned headers (icon, title, message), centered text inside buttons, and side-by-side layouts when double actions (Cancel / Submit) are present.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Preset Modals Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
              Preset UI Demonstrations
            </h3>

            {/* Presets Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              
              {/* Preset 1: Success Modal */}
              <div className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-all flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#3B7CED]" />
                    <span className="text-sm font-bold text-gray-800">1. Success Modal</span>
                  </div>
                  <p className="text-xs text-gray-400">Request Submitted (Single Action "Done")</p>
                </div>
                <Button
                  onClick={() =>
                    openModal(
                      "success",
                      "Request Submitted",
                      "Your request has successfully been submitted",
                      "Done"
                    )
                  }
                  size="sm"
                  className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white flex items-center gap-1.5"
                >
                  <Play size={12} /> Test
                </Button>
              </div>

              {/* Preset 2: Warning Modal */}
              <div className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-all flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#3B7CED]" />
                    <span className="text-sm font-bold text-gray-800">2. Warning (Double Action)</span>
                  </div>
                  <p className="text-xs text-gray-400">Above Available Budget (Cancel & Submit)</p>
                </div>
                <Button
                  onClick={() =>
                    openModal(
                      "warning",
                      "Above Available Budget",
                      "The total cost for your request is above the available budget and might be held. Will you like to submit anyways?",
                      "Submit",
                      "Cancel"
                    )
                  }
                  size="sm"
                  className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white flex items-center gap-1.5"
                >
                  <Play size={12} /> Test
                </Button>
              </div>

              {/* Preset 3: Error Modal */}
              <div className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-all flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-[#E43D2B]" />
                    <span className="text-sm font-bold text-gray-800">3. Error Modal</span>
                  </div>
                  <p className="text-xs text-gray-400">Submission Unsuccessful (Single Action "Try again")</p>
                </div>
                <Button
                  onClick={() =>
                    openModal(
                      "error",
                      "Submission Unsuccessful",
                      "Your request submission was unsuccessfully. Please try again.",
                      "Try again"
                    )
                  }
                  size="sm"
                  className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white flex items-center gap-1.5"
                >
                  <Play size={12} /> Test
                </Button>
              </div>

              {/* Preset 4: Info Modal */}
              <div className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-all flex items-center justify-between bg-gray-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-[#3B7CED]" />
                    <span className="text-sm font-bold text-gray-800">4. Info Modal</span>
                  </div>
                  <p className="text-xs text-gray-400">Information Message (Single Action "OK")</p>
                </div>
                <Button
                  onClick={() =>
                    openModal(
                      "info",
                      "Information Details",
                      "This is a standard information message providing background context about your request.",
                      "OK"
                    )
                  }
                  size="sm"
                  className="bg-[#3B7CED] hover:bg-[#2d63c7] text-white flex items-center gap-1.5"
                >
                  <Play size={12} /> Test
                </Button>
              </div>

            </div>
          </div>

          {/* Interactive Custom Playground Section */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#3B7CED] uppercase tracking-wider">
              Interactive Custom Playground
            </h3>

            {/* Playground Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
              {/* Type Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Modal Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["success", "error", "warning", "info"] as StatusType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setCustomType(t);
                        // Reset defaults based on type to make it feel rich
                        if (t === "success") {
                          setCustomTitle("Request Submitted");
                          setCustomActionText("Done");
                        } else if (t === "error") {
                          setCustomTitle("Submission Unsuccessful");
                          setCustomActionText("Try again");
                        } else if (t === "warning") {
                          setCustomTitle("Above Available Budget");
                          setCustomActionText("Submit");
                          setCustomSecondaryText("Cancel");
                        } else {
                          setCustomTitle("Information Details");
                          setCustomActionText("OK");
                        }
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-colors capitalize ${
                        customType === t
                          ? "bg-blue-50 border-[#3B7CED] text-[#3B7CED]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Modal Title</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="h-10 border-gray-200 text-sm shadow-none"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Modal Message</Label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Enter message..."
                  rows={2}
                  className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3B7CED] focus:ring-1 focus:ring-[#3B7CED] resize-none"
                />
              </div>

              {/* Button Customization Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Primary Button Text</Label>
                  <Input
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                    placeholder="e.g. Done"
                    className="h-10 border-gray-200 text-sm shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Secondary Button Text</Label>
                  <Input
                    value={customSecondaryText}
                    onChange={(e) => setCustomSecondaryText(e.target.value)}
                    placeholder="e.g. Cancel"
                    disabled={!hasSecondary}
                    className="h-10 border-gray-200 text-sm shadow-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Controls (Toggles) */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={hasSecondary}
                    onChange={(e) => setHasSecondary(e.target.checked)}
                    className="rounded border-gray-300 text-[#3B7CED] focus:ring-[#3B7CED]"
                  />
                  Enable Secondary Action Button
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={showCloseBtn}
                    onChange={(e) => setShowCloseBtn(e.target.checked)}
                    className="rounded border-gray-300 text-[#3B7CED] focus:ring-[#3B7CED]"
                  />
                  Show Close 'X' Button
                </label>
              </div>

              {/* Launch Custom Modal Button */}
              <button
                type="button"
                onClick={() =>
                  openModal(
                    customType,
                    customTitle,
                    customMessage,
                    customActionText,
                    hasSecondary ? customSecondaryText : undefined
                  )
                }
                className="w-full h-12 mt-2 bg-[#3B7CED] hover:bg-[#2d63c7] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-none transition-colors"
              >
                <Play size={14} fill="white" /> Launch Playground Modal
              </button>

            </div>
          </div>

        </div>
      </main>

      {/* Shared Status Modal Rendering */}
      <StatusModal
        isOpen={modalConfig.isOpen}
        onClose={handleClose}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        actionText={modalConfig.actionText}
        onAction={handleClose}
        secondaryText={modalConfig.secondaryText}
        onSecondary={handleClose}
        showCloseButton={modalConfig.showCloseButton}
      />
    </div>
  );
}

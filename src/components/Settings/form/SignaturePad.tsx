"use client";

import React, { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  onChange,
}: {
  onChange: (base64: string | null) => void;
}) {
  const sigRef = useRef<any>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Draw placeholder text on top of the canvas
  useEffect(() => {
    const canvas = sigRef.current?.getCanvas();
    if (canvas && isEmpty) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#ccc";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Click or draw your signature", canvas.width / 2, canvas.height / 2);
      }
    }
  }, [isEmpty]);

  const clearSignature = () => {
    sigRef.current.clear();
    setIsEmpty(true);
    onChange(null);
  };

  const saveSignature = () => {
    if (!sigRef.current.isEmpty()) {
      const base64 = sigRef.current
        .getTrimmedCanvas()
        .toDataURL("image/png")
        .replace(/^data:image\/png;base64,/, "");
      onChange(base64);
      setIsEmpty(false);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="flex flex-col gap-3 w-[30%]" ref={canvasWrapperRef}>
      <div className="border border-gray-300 rounded-md">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 300,
            height: 100,
            className: "rounded-md bg-white",
          }}
          onBegin={handleBegin} // hides placeholder when user starts drawing
        />
      </div>

      <div className="flex gap-3">

        <button
          type="button"
          className="px-6 py-2 bg-[#3B7CED] text-white rounded text-sm"
          onClick={saveSignature}
        >
          Upload signature
        </button>

        <button
          type="button"
          className="px-16 py-2 border border-[#3B7CED] rounded text-sm"
          onClick={clearSignature}
        >
          Clear
        </button>

        
      </div>
    </div>
  );
}

"use client";

import { Pencil, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  label?: string;
  image?: string | null;
  textToDisplay?: string;
  onChange: (file: File | null) => void;
}

const FormImageUpload = ({ label, image,textToDisplay, onChange }: ImageUploadProps) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const noImage = !image;

  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div className="relative w-32 h-32">

        {/* When NO IMAGE → show centered placeholder */}
        {noImage ? (
          <div className="w-full h-full rounded-full bg-[#E8EFFD] flex flex-col items-center justify-center text-center p-2">
            <ImageIcon size={28} className="text-[#3B7CED]/70 mb-1" />
            <p className="text-[10px] text-gray-600 leading-tight">
              {textToDisplay}
            </p>
          </div>
        ) : (
          <img
            src={
              image.startsWith("data:") || image.startsWith("http") || image.startsWith("blob:")
                ? image
                : `data:image/jpeg;base64,${image}`
            }
            alt="Preview"
            className="w-full h-full object-cover rounded-full bg-[#E8EFFD]"
          />
        )}

        {/* Pencil Icon (Always visible) */}
        <label className="absolute bottom-2 right-2 bg-[#3B7CED]/60 p-2 rounded-full cursor-pointer">
          <Pencil size={16} className="text-white" />
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>

      </div>
    </div>
  );
};

export default FormImageUpload;

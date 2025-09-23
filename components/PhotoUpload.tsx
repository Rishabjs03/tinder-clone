"use client";
import { uploadProfilePhoto } from "@/lib/actions/profile";
import React, { useRef, useState } from "react";

export default function PhotoUpload({
  onPhotoUpload,
}: {
  onPhotoUpload: (url: string) => void;
}) {
  const [uploading, setuploading] = useState<boolean>(false);
  const [error, seterror] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      seterror("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      seterror("Please select an image upto 5 MB");
      return;
    }
    setuploading(true);
    seterror(null);
    try {
      const result = await uploadProfilePhoto(file);
      if (result.success && result.url) {
        onPhotoUpload(result.url);
        seterror(null);
      } else {
        seterror(result.error ?? "Failed to upload photo");
      }
    } catch (error) {
      console.log("error in photoupload:", error);
      seterror("Failed to change photo");
    } finally {
      setuploading(false);
    }
  }
  function handleClick() {
    fileInputRef.current?.click();
  }
  return (
    <div className="absolute bottom-0 right-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Change photo"
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

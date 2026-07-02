"use client";

import { useState, useRef } from "react";

interface CloudinaryUploadProps {
  /** Current image URL (controlled by parent form state) */
  value: string;
  /** Called with the Cloudinary secure_url once upload succeeds */
  onUpload: (url: string) => void;
  /** Accent color for the button (orange | emerald) */
  accentColor?: "orange" | "emerald";
  /**
   * compact=true → smaller button, no URL text shown below.
   * Use inside tight grid cells (e.g. color rows).
   */
  compact?: boolean;
}

export default function CloudinaryUpload({
  value,
  onUpload,
  accentColor = "orange",
  compact = false,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const btnClass =
    accentColor === "emerald"
      ? "bg-[#10b981] hover:bg-emerald-600"
      : "bg-[#f97316] hover:bg-orange-600";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUpload(data.secure_url);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  /* ─── COMPACT MODE ─── */
  if (compact) {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`${btnClass} text-white text-[11px] font-bold px-2.5 py-1.5 rounded transition disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0l-3 3m3-3l3 3" />
                </svg>
                Upload
              </>
            )}
          </button>
          {value && !uploading && (
            <img
              src={value}
              alt="Preview"
              className="h-8 w-8 object-cover rounded border border-gray-200 bg-white shadow-sm"
            />
          )}
        </div>
        {error && <p className="text-red-500 text-[10px] font-medium">{error}</p>}
      </div>
    );
  }

  /* ─── NORMAL MODE ─── */
  return (
    <div className="space-y-2">
      {/* Hidden real file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {/* Upload button row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${btnClass} text-white text-sm font-semibold px-4 py-2 rounded transition disabled:opacity-60 flex items-center gap-2 whitespace-nowrap`}
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0l-3 3m3-3l3 3" />
              </svg>
              Upload Image
            </>
          )}
        </button>

        {/* Thumbnail preview */}
        {value && !uploading && (
          <img
            src={value}
            alt="Preview"
            className="h-10 w-10 object-cover rounded border border-gray-300 bg-white shadow-sm"
          />
        )}

        {/* Uploading status text */}
        {uploading && (
          <span className="text-sm text-gray-500 italic">Uploading…</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs font-medium">{error}</p>
      )}

      {/* Show the resolved URL as read-only confirmation */}
      {value && !uploading && (
        <p className="text-xs text-gray-400 truncate max-w-xs" title={value}>
          ✅ {value}
        </p>
      )}
    </div>
  );
}

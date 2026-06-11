"use client";

import Image from "next/image";
import React, { useEffect, useId, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import apiClient from "@/lib/apiClient";

type ImageUploadProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  maxSizeMB?: number;
  uploadEndpoint?: string;
  onUploadingChange?: (isUploading: boolean) => void;
};

type UploadResponse = {
  success?: boolean;
  message?: string;
  url?: string;
  fileId?: string;
  thumbnailUrl?: string;
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export default function ImageUpload({
  label,
  value,
  onChange,
  helperText = "PNG, JPG, WebP, or SVG up to 5 MB. Images upload to ImageKit.",
  maxSizeMB = 5,
  uploadEndpoint = "/upload",
  onUploadingChange,
}: ImageUploadProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    onUploadingChange?.(isProcessing);
  }, [isProcessing, onUploadingChange]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = async (file?: File) => {
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      setError("Please upload a PNG, JPG, WebP, or SVG image.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSizeMB} MB.`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return nextPreviewUrl;
    });

    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await apiClient.post<UploadResponse>(
        uploadEndpoint,
        formData
      );
      const uploadedUrl = result.url || result.thumbnailUrl;

      if (!uploadedUrl) {
        throw new Error(
          result.message || "Image uploaded, but no ImageKit URL was returned."
        );
      }

      setError(null);
      onChange(uploadedUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload this image. Please try another file."
      );
      setPreviewUrl((currentPreviewUrl) => {
        if (currentPreviewUrl) {
          URL.revokeObjectURL(currentPreviewUrl);
        }

        return null;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
          {previewUrl || value ? (
            <Image
              src={previewUrl || value}
              alt={label}
              fill
              unoptimized
              className="object-cover"
              sizes="220px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-theme-xs dark:bg-gray-900">
                <ImagePlus className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">No image selected</span>
            </div>
          )}
        </div>

        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[165px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-6 text-center transition ${
            isDragging
              ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
              : "border-gray-300 bg-white hover:border-brand-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:hover:border-brand-400 dark:hover:bg-white/[0.03]"
          }`}
        >
          <input
            id={inputId}
            type="file"
            accept={acceptedTypes.join(",")}
            className="sr-only"
            disabled={isProcessing}
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {isProcessing
              ? "Uploading to ImageKit..."
              : "Drop image here or click to upload"}
          </p>
          <p className="mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {value
              ? "ImageKit URL is ready to save with this record."
              : "The selected image uploads to ImageKit first."}
          </p>
        )}

        {(value || previewUrl) && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setPreviewUrl((currentPreviewUrl) => {
                if (currentPreviewUrl) {
                  URL.revokeObjectURL(currentPreviewUrl);
                }

                return null;
              });
              onChange("");
            }}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
          >
            <Trash2 className="h-4 w-4" />
            Remove Image
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Eye, ImageOff, Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type ImageViewerProps = {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export default function ImageViewer({
  src,
  alt,
  className = "h-24 w-24",
  imageClassName = "rounded-xl",
  fallbackClassName = "rounded-xl",
}: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300 ${className} ${fallbackClassName}`}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative shrink-0 overflow-hidden border border-gray-200 bg-gray-100 transition hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:focus:ring-brand-500/20 ${className} ${imageClassName}`}
        aria-label={`View ${alt} image`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="96px"
          className="object-cover transition duration-200 group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-gray-950/0 opacity-0 transition group-hover:bg-gray-950/35 group-hover:opacity-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-theme-sm">
            <Maximize2 className="h-4 w-4" />
          </span>
        </span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="mx-3 w-[calc(100%-1.5rem)] max-w-5xl overflow-hidden rounded-2xl p-0 sm:mx-6 sm:w-full"
      >
        <div className="border-b border-gray-100 bg-white px-5 py-4 pr-16 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
              <Eye className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-brand-500">Image Preview</p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {alt}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 dark:bg-gray-950 sm:p-6">
          <div className="relative mx-auto aspect-[4/3] max-h-[72vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-contain"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

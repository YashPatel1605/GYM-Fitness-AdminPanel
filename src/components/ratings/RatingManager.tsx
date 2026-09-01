"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit3,
  Save,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/apiClient";

type RatingUser = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
};

type RatingItem = {
  _id?: string;
  id?: string;
  userId?: string;
  user?: RatingUser;
  subtitle: string;
  rating: number;
  review: string;
  createdAt?: string;
  updatedAt?: string;
};

type RatingFormState = {
  userId: string;
  subtitle: string;
  rating: string;
  review: string;
};

type RatingResponse = {
  success?: boolean;
  total?: number;
  count?: number;
  data?: RatingItem[] | RatingItem | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  message?: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const pageSize = 10;

const initialFormState: RatingFormState = {
  userId: "",
  subtitle: "",
  rating: "5",
  review: "",
};

const toRatingId = (item: RatingItem) => item._id ?? item.id ?? "";

export default function RatingManager() {
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [formState, setFormState] = useState<RatingFormState>(initialFormState);
  const [selectedRating, setSelectedRating] = useState<RatingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRatings, setTotalRatings] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadRatings = async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<RatingResponse>(
        `/ratings?page=${page}&limit=${pageSize}`
      );
      const data = Array.isArray(result.data) ? result.data : [];
      setRatings(data);
      setTotalRatings(result.meta?.total ?? result.total ?? data.length);
      setTotalPages(Math.max(result.meta?.totalPages ?? 1, 1));
      setCurrentPage(result.meta?.page ?? page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch rating data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRatings(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (type: ToastState["type"], message: string) => {
    setToast({ type, message });
  };

  const resetForm = (clearAlerts = true) => {
    setSelectedRating(null);
    setFormState(initialFormState);

    if (clearAlerts) {
      setError(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm(false);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (rating: RatingItem) => {
    setSelectedRating(rating);
    setFormState({
      userId: rating.userId || "",
      subtitle: rating.subtitle || "",
      rating: String(rating.rating ?? 5),
      review: rating.review || "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const ratingId = selectedRating ? toRatingId(selectedRating) : "";

    if (!ratingId) {
      setError("Rating ID not found.");
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        subtitle: formState.subtitle,
        rating: Number(formState.rating),
        review: formState.review,
      };

      const result = await apiClient.put<RatingResponse>(`/ratings/${ratingId}`, payload);
      const updatedRating = Array.isArray(result.data)
        ? result.data[0]
        : result.data ?? selectedRating;

      setRatings((current) =>
        selectedRating
          ? current.map((item) =>
              toRatingId(item) === ratingId ? (updatedRating ?? item) : item
            )
          : current
      );

      showToast(
        "success",
        result.message || "User rating updated successfully."
      );
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update rating.";
      setError(message);
      showToast("error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (ratingId: string) => {
    const target = ratings.find((item) => toRatingId(item) === ratingId);
    const confirmed = window.confirm(
      "Are you sure you want to delete this user rating?"
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<RatingResponse>(`/ratings/${ratingId}`);
      setRatings((current) =>
        current.filter((item) => toRatingId(item) !== ratingId)
      );
      showToast(
        "success",
        result.message || `Rating for ${target?.userId || "user"} deleted successfully.`
      );

      if (selectedRating && toRatingId(selectedRating) === ratingId) {
        closeModal();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to delete rating.";
      setError(message);
      showToast("error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedRatings = useMemo(
    () => [...ratings].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [ratings]
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-5 top-5 z-99999 w-[calc(100%-2.5rem)] max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg dark:bg-gray-900 ${
              toast.type === "success"
                ? "border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300"
                : "border-red-200 text-red-700 dark:border-red-900 dark:text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="min-w-0 flex-1 text-sm font-medium">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">Rating Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            User Reviews & Ratings
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review each user rating, update details, or remove outdated feedback.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Ratings</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {totalRatings}
          </p>
        </div>
      </div>

      <ComponentCard title="" desc="">
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    SR No.
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Subtitle
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Review
                  </th>
                  <th className="px-5 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading ratings...
                    </td>
                  </tr>
                ) : sortedRatings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No ratings found.
                    </td>
                  </tr>
                ) : (
                  sortedRatings.map((rating, index) => (
                    <tr key={toRatingId(rating) || `${rating.userId}-${rating.subtitle}`}>
                      <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-3">
                          {rating.user?.avatar ? (
                            <div className="relative h-9 w-9 overflow-hidden rounded-full">
                              <Image
                                src={rating.user.avatar}
                                alt={rating.user.name || "User avatar"}
                                width={36}
                                height={36}
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                              {((rating.user?.name || "U").charAt(0) || "U").toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800 dark:text-white/90">
                              {rating.user?.name || "Unknown User"}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {rating.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {rating.subtitle}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge color="warning" variant="light" size="sm">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {rating.rating}
                          </span>
                        </Badge>
                      </td>
                      <td className="max-w-[360px] px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="line-clamp-2">{rating.review}</div>
                      </td>
                      <td className="px-5 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(rating)}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(toRatingId(rating))}
                            disabled={isSaving || !toRatingId(rating)}
                            className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>

      <div className="flex justify-end pb-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="mx-4 max-w-2xl p-6 lg:p-8"
      >
        <div className="pr-10">
          <p className="text-sm font-medium text-brand-500">Edit Rating</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            Update User Review
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Subtitle
            </label>
            <input
              required
              name="subtitle"
              value={formState.subtitle}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="Lost 20 lbs — 3 months"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <input
              required
              type="number"
              min={1}
              max={5}
              name="rating"
              value={formState.rating}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Review
            </label>
            <textarea
              required
              name="review"
              rows={5}
              value={formState.review}
              onChange={handleInputChange}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="Enter user review"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Update Rating"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

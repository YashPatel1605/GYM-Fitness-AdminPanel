"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle,
  Edit3,
  Plus,
  Save,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ImageUpload from "@/components/common/ImageUpload";
import ImageViewer from "@/components/common/ImageViewer";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/apiClient";

type Philosophy = {
  _id?: string;
  title: string;
  description: string;
};

type Trainer = {
  _id: string;
  name: string;
  slug: string;
  role: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  experience: number;
  certification: string;
  speciality: string;
  specialityTag: string;
  isFeatured: boolean;
  rating: number;
  totalClients: number;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  trainingPhilosophy: Philosophy[];
  createdAt: string;
  updatedAt: string;
};

type TrainerResponse = {
  success?: boolean;
  total?: number;
  data: Trainer[] | Trainer;
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

type FormState = {
  name: string;
  slug: string;
  role: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  experience: string;
  certification: string;
  speciality: string;
  specialityTag: string;
  isFeatured: boolean;
  rating: string;
  totalClients: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  trainingPhilosophy: Philosophy[];
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const pageSize = 10;

const initialPhilosophy: Philosophy = {
  title: "",
  description: "",
};

const initialFormState: FormState = {
  name: "",
  slug: "",
  role: "",
  category: "",
  shortDescription: "",
  fullDescription: "",
  image: "",
  experience: "1",
  certification: "",
  speciality: "",
  specialityTag: "",
  isFeatured: false,
  rating: "4.5",
  totalClients: "0",
  facebook: "",
  instagram: "",
  twitter: "",
  linkedin: "",
  trainingPhilosophy: [{ ...initialPhilosophy }],
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value: string, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const categoryColor = (
  category: string
): "success" | "warning" | "info" | "primary" | "error" => {
  const normalized = category.toLowerCase();

  if (normalized.includes("cardio")) return "error";
  if (normalized.includes("strength")) return "warning";
  if (normalized.includes("yoga")) return "success";

  return "info";
};

export default function TrainerManager() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTrainers, setTotalTrainers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadTrainers = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<TrainerResponse>(
        `/trainers?page=${page}&limit=${pageSize}`
      );

      setTrainers(Array.isArray(result.data) ? result.data : []);
      setTotalTrainers(result.meta?.total ?? result.total ?? 0);
      setTotalPages(Math.max(result.meta?.totalPages ?? 1, 1));
      setCurrentPage(result.meta?.page ?? page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch Trainers data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrainers(currentPage);
  }, [currentPage, loadTrainers]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (type: ToastState["type"], message: string) => {
    setToast({ type, message });
  };

  const resetForm = (clearAlerts = true) => {
    setSelectedTrainer(null);
    setFormState(initialFormState);

    if (clearAlerts) {
      setError(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeaturedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      isFeatured: event.target.checked,
    }));
  };

  const handleImageChange = (image: string) => {
    setFormState((prev) => ({
      ...prev,
      image,
    }));
  };

  const handlePhilosophyChange = (
    index: number,
    field: keyof Philosophy,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      trainingPhilosophy: prev.trainingPhilosophy.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPhilosophyRow = () => {
    setFormState((prev) => ({
      ...prev,
      trainingPhilosophy: [
        ...prev.trainingPhilosophy,
        { ...initialPhilosophy },
      ],
    }));
  };

  const removePhilosophyRow = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      trainingPhilosophy:
        prev.trainingPhilosophy.length === 1
          ? [{ ...initialPhilosophy }]
          : prev.trainingPhilosophy.filter(
              (_, currentIndex) => currentIndex !== index
            ),
    }));
  };

  const buildPayload = () => ({
    name: formState.name.trim(),
    slug: formState.slug.trim() || slugify(formState.name),
    role: formState.role.trim(),
    category: formState.category.trim(),
    shortDescription: formState.shortDescription.trim(),
    fullDescription: formState.fullDescription.trim(),
    image: formState.image.trim(),
    experience: toNumber(formState.experience),
    certification: formState.certification.trim(),
    speciality: formState.speciality.trim(),
    specialityTag: formState.specialityTag.trim(),
    isFeatured: formState.isFeatured,
    rating: toNumber(formState.rating, 0),
    totalClients: toNumber(formState.totalClients, 0),
    socialLinks: {
      facebook: formState.facebook.trim(),
      instagram: formState.instagram.trim(),
      twitter: formState.twitter.trim(),
      linkedin: formState.linkedin.trim(),
    },
    trainingPhilosophy: formState.trainingPhilosophy
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      }))
      .filter((item) => item.title && item.description),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isImageUploading) {
      const errorMessage = "Please wait until the image upload finishes.";

      setError(errorMessage);
      showToast("error", errorMessage);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(selectedTrainer);
      const result = isEditing
        ? await apiClient.put<TrainerResponse>(
            `/trainers/${selectedTrainer?._id}`,
            buildPayload()
          )
        : await apiClient.post<TrainerResponse>("/trainers", buildPayload());
      const savedTrainer = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      showToast(
        "success",
        result.message ||
          `Trainer "${savedTrainer.name}" ${
            isEditing ? "updated" : "added"
          } successfully.`
      );
      closeModal();
      await loadTrainers(isEditing ? currentPage : 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save Trainer.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setFormState({
      name: trainer.name || "",
      slug: trainer.slug || "",
      role: trainer.role || "",
      category: trainer.category || "",
      shortDescription: trainer.shortDescription || "",
      fullDescription: trainer.fullDescription || "",
      image: trainer.image || "",
      experience: String(trainer.experience ?? ""),
      certification: trainer.certification || "",
      speciality: trainer.speciality || "",
      specialityTag: trainer.specialityTag || "",
      isFeatured: Boolean(trainer.isFeatured),
      rating: String(trainer.rating ?? ""),
      totalClients: String(trainer.totalClients ?? ""),
      facebook: trainer.socialLinks?.facebook || "",
      instagram: trainer.socialLinks?.instagram || "",
      twitter: trainer.socialLinks?.twitter || "",
      linkedin: trainer.socialLinks?.linkedin || "",
      trainingPhilosophy:
        trainer.trainingPhilosophy?.length > 0
          ? trainer.trainingPhilosophy.map((item) => ({
              title: item.title,
              description: item.description,
            }))
          : [{ ...initialPhilosophy }],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (trainerId: string) => {
    const trainerToDelete = trainers.find((trainer) => trainer._id === trainerId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Trainer?"
    );

    if (!confirmDelete) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<TrainerResponse>(
        `/trainers/${trainerId}`
      );
      const nextPage =
        trainers.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      showToast(
        "success",
        result.message ||
          `Trainer "${trainerToDelete?.name || "item"}" deleted successfully.`
      );
      await loadTrainers(nextPage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete Trainer.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedTrainers = useMemo(
    () =>
      [...trainers].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [trainers]
  );

  const actionLabel = selectedTrainer ? "Update Trainer" : "Add Trainer";

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
          <p className="text-sm font-medium text-brand-500">
            Trainers Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Fitness Trainers
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            List, create, update, and delete Trainers using your backend API.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Trainers
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {totalTrainers}
          </p>
        </div>
      </div>

      <ComponentCard title="" desc="">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Add Trainer
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trainer
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Experience
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Rating
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Featured
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
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading Trainers...
                    </td>
                  </tr>
                ) : sortedTrainers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No Trainers found.
                    </td>
                  </tr>
                ) : (
                  sortedTrainers.map((trainer) => (
                    <tr key={trainer._id} className="align-top">
                      <td className="px-5 py-5">
                        <div className="flex min-w-[520px] items-start gap-4">
                          <ImageViewer
                            src={trainer.image}
                            alt={trainer.name}
                            className="h-24 w-24"
                          />
                          <div>
                            <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                              {trainer.name}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                              {trainer.role || "Trainer"}
                            </p>
                            <p className="mt-2 max-w-[420px] text-sm leading-6 text-gray-500 dark:text-gray-400">
                              {trainer.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge
                          color={categoryColor(trainer.category)}
                          variant="light"
                          size="sm"
                        >
                          {trainer.category || "General"}
                        </Badge>
                        {trainer.specialityTag && (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {trainer.specialityTag}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="block text-gray-800 dark:text-white/90">
                          {trainer.experience} years
                        </span>
                        <span>{trainer.totalClients} clients</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 text-gray-800 dark:text-white/90">
                          <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
                          {trainer.rating}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge
                          color={trainer.isFeatured ? "success" : "light"}
                          variant="light"
                          size="sm"
                        >
                          {trainer.isFeatured ? "Featured" : "Standard"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(trainer)}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(trainer._id)}
                            disabled={isSaving}
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

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
            />
          </div>
        )}
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="mx-3 my-4 max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-2xl p-0 sm:mx-4 sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:w-full"
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4 pr-16 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-5">
          <p className="text-sm font-medium text-brand-500">
            {selectedTrainer ? "Edit Trainer" : "Add Trainer"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedTrainer ? "Update Trainer Details" : "Create New Trainer"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="block">
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <ImageUpload
              label="Upload Trainer Image"
              value={formState.image}
              onChange={handleImageChange}
              onUploadingChange={setIsImageUploading}
              helperText="Use a clear trainer portrait. PNG, JPG, WebP, or SVG up to 5 MB."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  required
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Emily Carter"
                />
              </Field>

              <Field label="Slug">
                <input
                  name="slug"
                  value={formState.slug}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="auto-generated from name"
                />
              </Field>

              <Field label="Role">
                <input
                  required
                  name="role"
                  value={formState.role}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Cardio Coach"
                />
              </Field>

              <Field label="Category">
                <input
                  required
                  name="category"
                  value={formState.category}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Cardio"
                />
              </Field>

              <Field label="Certification">
                <input
                  name="certification"
                  value={formState.certification}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="AFAA Certified"
                />
              </Field>

              <Field label="Experience">
                <input
                  required
                  min="0"
                  name="experience"
                  type="number"
                  value={formState.experience}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>

              <Field label="Total Clients">
                <input
                  min="0"
                  name="totalClients"
                  type="number"
                  value={formState.totalClients}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>

              <Field label="Rating">
                <input
                  min="0"
                  max="5"
                  step="0.1"
                  name="rating"
                  type="number"
                  value={formState.rating}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>

              <Field label="Speciality">
                <input
                  name="speciality"
                  value={formState.speciality}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Cardio"
                />
              </Field>

              <Field label="Speciality Tag">
                <input
                  name="specialityTag"
                  value={formState.specialityTag}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Endurance Training"
                />
              </Field>

              <Field label="Featured">
                <label className="flex min-h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formState.isFeatured}
                    onChange={handleFeaturedChange}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Show as featured trainer
                </label>
              </Field>
            </div>

            <Field label="Short Description">
              <textarea
                required
                name="shortDescription"
                rows={2}
                value={formState.shortDescription}
                onChange={handleInputChange}
                className={textareaClassName}
                placeholder="Brief listing summary"
              />
            </Field>

            <Field label="Full Description">
              <textarea
                required
                name="fullDescription"
                rows={4}
                value={formState.fullDescription}
                onChange={handleInputChange}
                className={textareaClassName}
                placeholder="Detailed trainer description"
              />
            </Field>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Social Links
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Facebook">
                  <input
                    name="facebook"
                    value={formState.facebook}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="https://facebook.com/emily"
                  />
                </Field>
                <Field label="Instagram">
                  <input
                    name="instagram"
                    value={formState.instagram}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="https://instagram.com/emily"
                  />
                </Field>
                <Field label="Twitter">
                  <input
                    name="twitter"
                    value={formState.twitter}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="https://twitter.com/emily"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    name="linkedin"
                    value={formState.linkedin}
                    onChange={handleInputChange}
                    className={inputClassName}
                    placeholder="https://linkedin.com/emily"
                  />
                </Field>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Training Philosophy
                </label>
                <button
                  type="button"
                  onClick={addPhilosophyRow}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Philosophy
                </button>
              </div>

              <div className="space-y-3">
                {formState.trainingPhilosophy.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 lg:grid-cols-[220px_1fr_auto]"
                  >
                    <input
                      value={item.title}
                      onChange={(event) =>
                        handlePhilosophyChange(index, "title", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="Move Every Day"
                    />
                    <input
                      value={item.description}
                      onChange={(event) =>
                        handlePhilosophyChange(
                          index,
                          "description",
                          event.target.value
                        )
                      }
                      className={inputClassName}
                      placeholder="Daily movement creates a healthier lifestyle."
                    />
                    <button
                      type="button"
                      onClick={() => removePhilosophyRow(index)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                      aria-label="Remove philosophy"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
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
              disabled={isSaving || isImageUploading}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {isImageUploading ? "Uploading..." : isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400";

const textareaClassName =
  "w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
    </div>
  );
}

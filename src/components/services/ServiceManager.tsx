"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit3,
  Layers3,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ImageUpload from "@/components/common/ImageUpload";
import ImageViewer from "@/components/common/ImageViewer";
import ComponentCard from "@/components/common/ComponentCard";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/apiClient";

type Service = {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  iconName: string;
  isFeatured: boolean;
  features: string[];
  benefits: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type ServiceResponse = {
  success?: boolean;
  count?: number;
  data?: Service[] | Service;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
  message?: string;
};

type FormState = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  iconName: string;
  isFeatured: boolean;
  features: string[];
  benefits: string[];
  isActive: boolean;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const initialFormState: FormState = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  image: "",
  iconName: "FaDumbbell",
  isFeatured: false,
  features: [""],
  benefits: [""],
  isActive: true,
};

const iconOptions = [
  "FaDumbbell",
  "FaUsers",
  "FaUserTie",
  "FaFireAlt",
  "FaHeartbeat",
  "FaRunning",
  "FaAppleAlt",
  "FaCalendarCheck",
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const cleanList = (items: string[] = []) =>
  items.map((item) => item.trim()).filter(Boolean);

const ensureListInputs = (items: string[] = []) =>
  items.length > 0 ? [...items] : [""];

const isService = (value: unknown): value is Service =>
  Boolean(
    value &&
      typeof value === "object" &&
      "_id" in value &&
      "title" in value
  );

const normalizeServices = (data: ServiceResponse["data"]) => {
  if (Array.isArray(data)) {
    return data.filter(isService);
  }

  return isService(data) ? [data] : [];
};

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ServiceResponse>("/services");
      setServices(normalizeServices(result.data));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch Services data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

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
    setSelectedService(null);
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
    const target = event.target;
    const { name, value } = target;

    setFormState((prev) => ({
      ...prev,
      [name]:
        target instanceof HTMLInputElement && target.type === "checkbox"
          ? target.checked
          : value,
    }));
  };

  const handleImageChange = (image: string) => {
    setFormState((prev) => ({
      ...prev,
      image,
    }));
  };

  const handleListItemChange = (
    field: "features" | "benefits",
    index: number,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: prev[field].map((item, currentIndex) =>
        currentIndex === index ? value : item
      ),
    }));
  };

  const addListItem = (field: "features" | "benefits") => {
    setFormState((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeListItem = (field: "features" | "benefits", index: number) => {
    setFormState((prev) => ({
      ...prev,
      [field]:
        prev[field].length === 1
          ? [""]
          : prev[field].filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const buildPayload = () => ({
    title: formState.title.trim(),
    slug: formState.slug.trim() || slugify(formState.title),
    shortDescription: formState.shortDescription.trim(),
    fullDescription: formState.fullDescription.trim(),
    image: formState.image.trim(),
    iconName: formState.iconName.trim(),
    isFeatured: formState.isFeatured,
    features: cleanList(formState.features),
    benefits: cleanList(formState.benefits),
    isActive: formState.isActive,
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
      const isEditing = Boolean(selectedService);
      const result = isEditing
        ? await apiClient.put<ServiceResponse>(
            `/services/${selectedService?._id}`,
            buildPayload()
          )
        : await apiClient.post<ServiceResponse>("/services", buildPayload());
      const savedService = normalizeServices(result.data)[0];

      showToast(
        "success",
        result.message ||
          `Service "${savedService?.title || formState.title}" ${
            isEditing ? "updated" : "added"
          } successfully.`
      );
      closeModal();
      await loadServices();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save Service.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormState({
      title: service.title || "",
      slug: service.slug || "",
      shortDescription: service.shortDescription || "",
      fullDescription: service.fullDescription || "",
      image: service.image || "",
      iconName: service.iconName || "FaDumbbell",
      isFeatured: Boolean(service.isFeatured),
      features: ensureListInputs(service.features),
      benefits: ensureListInputs(service.benefits),
      isActive: service.isActive !== false,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    const serviceToDelete = services.find((service) => service._id === serviceId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Service?"
    );

    if (!confirmDelete) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<ServiceResponse>(
        `/services/${serviceId}`
      );
      setServices((current) =>
        current.filter((service) => service._id !== serviceId)
      );
      showToast(
        "success",
        result.message ||
          `Service "${serviceToDelete?.title || "item"}" deleted successfully.`
      );

      if (selectedService?._id === serviceId) {
        closeModal();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete Service.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedServices = useMemo(
    () =>
      services.filter(isService).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [services]
  );

  const activeServices = services.filter((service) => service.isActive).length;
  const featuredServices = services.filter((service) => service.isFeatured).length;
  const actionLabel = selectedService ? "Update Service" : "Add Service";

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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">
            Services Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Gym Services
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            List, create, update, and delete Services using your backend API.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Services" value={services.length} />
          <StatCard label="Active Services" value={activeServices} />
          <StatCard label="Featured" value={featuredServices} />
        </div>
      </div>

      <ComponentCard title="" desc="">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Service Catalog
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review the cover, visibility, highlights, and service actions in
              one clean view.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              Loading Services...
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                No Services found.
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Add your first service to start building the catalog.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedServices.map((service) => (
                <article
                  key={service._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs transition hover:border-brand-200 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/30"
                >
                  <div className="grid gap-0 xl:grid-cols-[190px_minmax(0,1fr)_360px_142px]">
                    <div className="relative min-h-44 border-b border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-950 xl:border-b-0 xl:border-r">
                      <ImageViewer
                        src={service.image}
                        alt={service.title}
                        className="h-full min-h-44 w-full"
                        imageClassName="rounded-none border-0"
                        fallbackClassName="rounded-none"
                      />
                    </div>

                    <div className="min-w-0 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {service.title}
                        </h3>
                        {service.isFeatured && (
                          <Badge color="warning" variant="light" size="sm">
                            Featured
                          </Badge>
                        )}
                        <Badge
                          color={service.isActive ? "success" : "error"}
                          variant="light"
                          size="sm"
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                        {service.shortDescription}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700 dark:bg-white/5 dark:text-gray-300">
                          {service.iconName || "No icon"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-white/5">
                          /{service.slug}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 border-t border-gray-100 p-5 dark:border-gray-800 md:grid-cols-2 xl:border-l xl:border-t-0 xl:grid-cols-1">
                      <ServicePreviewList
                        icon={<Layers3 className="h-4 w-4" />}
                        title="Features"
                        items={service.features}
                      />
                      <ServicePreviewList
                        icon={<Sparkles className="h-4 w-4" />}
                        title="Benefits"
                        items={service.benefits}
                      />
                    </div>

                    <div className="flex items-center gap-2 border-t border-gray-100 p-5 dark:border-gray-800 xl:flex-col xl:items-stretch xl:justify-center xl:border-l xl:border-t-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 xl:flex-none"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service._id)}
                        disabled={isSaving}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900 xl:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="mx-3 my-4 max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-2xl p-0 sm:mx-4 sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:w-full"
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4 pr-16 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-5">
          <p className="text-sm font-medium text-brand-500">
            {selectedService ? "Edit Service" : "Add Service"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedService ? "Update Service Details" : "Create New Service"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="block">
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <ImageUpload
              label="Upload Service Image"
              value={formState.image}
              onChange={handleImageChange}
              onUploadingChange={setIsImageUploading}
              helperText="Use a clear service cover image. PNG, JPG, WebP, or SVG up to 5 MB."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  required
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Personal Training"
                />
              </Field>

              <Field label="Slug">
                <input
                  name="slug"
                  value={formState.slug}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="auto-generated from title"
                />
              </Field>

              <Field label="Icon Name">
                <select
                  name="iconName"
                  value={formState.iconName}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  {iconOptions.map((iconName) => (
                    <option key={iconName} value={iconName}>
                      {iconName}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formState.isFeatured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Featured
                </label>
                <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formState.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Active
                </label>
              </div>
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
                placeholder="Detailed service description"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <ListInputGroup
                label="Features"
                addLabel="Add Feature"
                items={formState.features}
                placeholder="Comprehensive initial fitness assessment"
                onAdd={() => addListItem("features")}
                onChange={(index, value) =>
                  handleListItemChange("features", index, value)
                }
                onRemove={(index) => removeListItem("features", index)}
              />

              <ListInputGroup
                label="Benefits"
                addLabel="Add Benefit"
                items={formState.benefits}
                placeholder="Faster, more sustainable results"
                onAdd={() => addListItem("benefits")}
                onChange={(index, value) =>
                  handleListItemChange("benefits", index, value)
                }
                onRemove={(index) => removeListItem("benefits", index)}
              />
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ServicePreviewList({
  icon,
  title,
  items = [],
}: {
  icon: React.ReactNode;
  title: string;
  items?: string[];
}) {
  const visibleItems = items.slice(0, 2);
  const remainingCount = Math.max(items.length - visibleItems.length, 0);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-brand-500 shadow-theme-xs dark:bg-gray-900 dark:text-brand-300">
          {icon}
        </span>
        {title}
      </div>

      {visibleItems.length > 0 ? (
        <ul className="space-y-1.5">
          {visibleItems.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-xs leading-5 text-gray-600 dark:text-gray-300"
            >
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-500" />
              <span className="line-clamp-2">{item}</span>
            </li>
          ))}
          {remainingCount > 0 && (
            <li className="text-xs font-medium text-brand-500 dark:text-brand-300">
              +{remainingCount} more
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No {title.toLowerCase()} added.
        </p>
      )}
    </div>
  );
}

function ListInputGroup({
  label,
  addLabel,
  items,
  placeholder,
  onAdd,
  onChange,
  onRemove,
}: {
  label: string;
  addLabel: string;
  items: string[];
  placeholder: string;
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-2 sm:grid-cols-[1fr_auto]"
          >
            <input
              value={item}
              onChange={(event) => onChange(index, event.target.value)}
              className={inputClassName}
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
              aria-label={`Remove ${label.slice(0, -1).toLowerCase()}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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

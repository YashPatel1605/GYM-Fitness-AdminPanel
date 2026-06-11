"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  CreditCard,
  Edit3,
  Plus,
  Save,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/apiClient";

type PlanFeature = {
  _id?: string;
  name: string;
  included: boolean;
};

type MembershipPlan = {
  _id: string;
  name: string;
  price: number;
  isPopular: boolean;
  features: PlanFeature[];
  createdAt: string;
  updatedAt: string;
};

type PlanResponse = {
  success?: boolean;
  count?: number;
  data: MembershipPlan[] | MembershipPlan;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

type FormState = {
  name: string;
  price: string;
  isPopular: boolean;
  features: PlanFeature[];
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const initialFeature: PlanFeature = {
  name: "",
  included: true,
};

const initialFormState: FormState = {
  name: "",
  price: "",
  isPopular: false,
  features: [{ ...initialFeature }],
};

const toPrice = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function MembershipPlanManager() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<PlanResponse>("/plan");
      setPlans(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch plan data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
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
    setSelectedPlan(null);
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

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target;
    const { name, value, type } = target;
    const key = name as keyof FormState;

    setFormState((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? target.checked : value,
    }));
  };

  const handleFeatureChange = (
    index: number,
    field: keyof PlanFeature,
    value: string | boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      features: prev.features.map((feature, currentIndex) =>
        currentIndex === index
          ? {
              ...feature,
              [field]: value,
            }
          : feature
      ),
    }));
  };

  const addFeatureRow = () => {
    setFormState((prev) => ({
      ...prev,
      features: [...prev.features, { ...initialFeature }],
    }));
  };

  const removeFeatureRow = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      features:
        prev.features.length === 1
          ? [{ ...initialFeature }]
          : prev.features.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const features = formState.features
      .map((feature) => ({
        name: feature.name.trim(),
        included: Boolean(feature.included),
      }))
      .filter((feature) => feature.name);

    try {
      const isEditing = Boolean(selectedPlan);
      const payload = {
        name: formState.name.trim().toUpperCase(),
        price: toPrice(formState.price),
        isPopular: formState.isPopular,
        features,
      };

      const result = isEditing
        ? await apiClient.put<PlanResponse>(
            `/plan/${selectedPlan?._id}`,
            payload
          )
        : await apiClient.post<PlanResponse>("/plan", payload);
      const savedPlan = Array.isArray(result.data) ? result.data[0] : result.data;

      setPlans((current) => {
        if (selectedPlan) {
          return current.map((plan) =>
            plan._id === savedPlan._id ? savedPlan : plan
          );
        }

        return [savedPlan, ...current];
      });
      showToast(
        "success",
        result.message ||
          `Membership plan "${savedPlan.name}" ${
            isEditing ? "updated" : "created"
          } successfully.`
      );
      closeModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save membership plan.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setFormState({
      name: plan.name || "",
      price: String(plan.price ?? ""),
      isPopular: Boolean(plan.isPopular),
      features:
        plan.features?.length > 0
          ? plan.features.map((feature) => ({
              name: feature.name,
              included: feature.included,
            }))
          : [{ ...initialFeature }],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (planId: string) => {
    const planToDelete = plans.find((plan) => plan._id === planId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this membership plan?"
    );

    if (!confirmDelete) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<PlanResponse>(`/plan/${planId}`);
      setPlans((current) => current.filter((plan) => plan._id !== planId));
      showToast(
        "success",
        result.message ||
          `Membership plan "${planToDelete?.name || "item"}" deleted successfully.`
      );

      if (selectedPlan?._id === planId) {
        closeModal();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete membership plan.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const actionLabel = selectedPlan ? "Update Plan" : "Create Plan";
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans]
  );
  const popularPlans = plans.filter((plan) => plan.isPopular).length;
  const totalFeatures = plans.reduce(
    (total, plan) => total + (plan.features?.length || 0),
    0
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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">
            Membership Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Membership Plans
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View, create, update, and delete gym membership plans from one clear
            admin screen.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Plans" value={plans.length} />
          <StatCard label="Popular Plans" value={popularPlans} />
          <StatCard label="Plan Features" value={totalFeatures} />
        </div>
      </div>

      <ComponentCard title="" desc="">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Plan List
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Price, popularity, included facilities, and actions are visible at
              a glance.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Add Plan
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Plan
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Price
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Features
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
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
                      Loading membership plans...
                    </td>
                  </tr>
                ) : sortedPlans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No membership plans found.
                    </td>
                  </tr>
                ) : (
                  sortedPlans.map((plan) => {
                    const includedCount =
                      plan.features?.filter((feature) => feature.included)
                        .length || 0;

                    return (
                      <tr key={plan._id}>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                  {plan.name}
                                </p>
                                {plan.isPopular && (
                                  <Badge color="warning" variant="light" size="sm">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {includedCount} of {plan.features?.length || 0}{" "}
                                features included
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            per membership cycle
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-[420px] flex-wrap gap-2">
                            {plan.features?.length > 0 ? (
                              plan.features.slice(0, 5).map((feature) => (
                                <Badge
                                  key={`${plan._id}-${feature._id || feature.name}`}
                                  color={feature.included ? "success" : "dark"}
                                  variant="light"
                                  size="sm"
                                >
                                  {feature.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                No features
                              </span>
                            )}
                            {plan.features?.length > 5 && (
                              <Badge color="light" size="sm">
                                +{plan.features.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            color={plan.isPopular ? "warning" : "info"}
                            variant="light"
                            size="sm"
                          >
                            {plan.isPopular ? "Highlighted" : "Standard"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(plan)}
                              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              <Edit3 className="mr-1 h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(plan._id)}
                              disabled={isSaving}
                              className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="mx-3 my-4 max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl p-0 sm:mx-4 sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:w-full"
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4 pr-16 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-5">
          <p className="text-sm font-medium text-brand-500">
            {selectedPlan ? "Edit Plan" : "Add Plan"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedPlan ? "Update Membership Plan" : "Create Membership Plan"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="block">
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Plan Name">
                <input
                  required
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="PREMIUM"
                />
              </Field>

              <Field label="Price">
                <input
                  required
                  min="0"
                  name="price"
                  type="number"
                  value={formState.price}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="3500"
                />
              </Field>
            </div>

            <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
              <input
                type="checkbox"
                name="isPopular"
                checked={formState.isPopular}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4 text-warning-500" />
                Mark as popular plan
              </span>
            </label>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Features
                </label>
                <button
                  type="button"
                  onClick={addFeatureRow}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Feature
                </button>
              </div>

              <div className="space-y-3">
                {formState.features.map((feature, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:grid-cols-[1fr_150px_auto]"
                  >
                    <input
                      required
                      value={feature.name}
                      onChange={(event) =>
                        handleFeatureChange(index, "name", event.target.value)
                      }
                      className={inputClassName}
                      placeholder="Gym Floor Access"
                    />
                    <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={feature.included}
                        onChange={(event) =>
                          handleFeatureChange(
                            index,
                            "included",
                            event.target.checked
                          )
                        }
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      Included
                    </label>
                    <button
                      type="button"
                      onClick={() => removeFeatureRow(index)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                      aria-label="Remove feature"
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
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400";

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

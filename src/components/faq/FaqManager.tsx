"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import { Modal } from "@/components/ui/modal";
import apiClient from "@/lib/apiClient";

type FaqItem = {
  _id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
};

type FaqResponse = {
  success: boolean;
  count?: number;
  data: FaqItem[] | FaqItem;
  message?: string;
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const initialFormState: FormState = {
  question: "",
  answer: "",
  category: "Membership",
  isActive: true,
};

export default function FaqManager() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadFaqs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<FaqResponse>("/faq");
      setFaqs(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch FAQ data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
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
    setSelectedFaq(null);
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
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;
    const { name, value, type } = target;
    const key = name as keyof FormState;

    setFormState((prev) => ({
      ...prev,
      [key]:
        type === "checkbox" && target instanceof HTMLInputElement
          ? target.checked
          : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(selectedFaq);
      const payload = {
        ...formState,
        order: selectedFaq ? selectedFaq.order : faqs.length + 1,
      };
      const result = isEditing
        ? await apiClient.put<FaqResponse>(`/faq/${selectedFaq?._id}`, payload)
        : await apiClient.post<FaqResponse>("/faq", payload);
      const savedFaq = Array.isArray(result.data) ? result.data[0] : result.data;

      setFaqs((current) => {
        if (selectedFaq) {
          return current.map((faq) =>
            faq._id === savedFaq._id ? savedFaq : faq
          );
        }

        return [savedFaq, ...current];
      });
      showToast(
        "success",
        result.message ||
          `FAQ "${savedFaq.question}" ${isEditing ? "updated" : "added"} successfully.`
      );
      closeModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save FAQ.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setFormState({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "Membership",
      isActive: faq.isActive,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (faqId: string) => {
    const faqToDelete = faqs.find((faq) => faq._id === faqId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this FAQ item?"
    );

    if (!confirmDelete) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<FaqResponse>(`/faq/${faqId}`);
      setFaqs((current) => current.filter((faq) => faq._id !== faqId));
      showToast(
        "success",
        result.message ||
          `FAQ "${faqToDelete?.question || "item"}" deleted successfully.`
      );

      if (selectedFaq?._id === faqId) {
        closeModal();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete FAQ.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const actionLabel = selectedFaq ? "Update FAQ" : "Add FAQ";
  const activeFaqs = useMemo(
    () => [...faqs].sort((a, b) => a.order - b.order),
    [faqs]
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
          <p className="text-sm font-medium text-brand-500">FAQ Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create, edit, and delete FAQ items using your backend API.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total FAQs
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {faqs.length}
          </p>
        </div>
      </div>

      <ComponentCard
        title=""
        desc=""
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Question
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Answer
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Category
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
                      Loading FAQs...
                    </td>
                  </tr>
                ) : activeFaqs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No FAQ items found.
                    </td>
                  </tr>
                ) : (
                  activeFaqs.map((faq) => (
                    <tr key={faq._id}>
                      <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                        {faq.question}
                      </td>
                      <td className="max-w-[320px] truncate px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {faq.answer}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {faq.category}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge
                          color={faq.isActive ? "success" : "dark"}
                          variant="light"
                          size="sm"
                        >
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(faq)}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(faq._id)}
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
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="mx-4 max-w-2xl p-6 lg:p-8"
      >
        <div className="pr-10">
          <p className="text-sm font-medium text-brand-500">
            {selectedFaq ? "Edit FAQ" : "Add FAQ"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedFaq ? "Update FAQ Details" : "Create New FAQ"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Question
            </label>
            <input
              required
              name="question"
              value={formState.question}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="Enter FAQ question"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Answer
            </label>
            <textarea
              required
              name="answer"
              rows={5}
              value={formState.answer}
              onChange={handleInputChange}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="Enter FAQ answer"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <input
              name="category"
              value={formState.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:focus:border-brand-400"
              placeholder="Membership"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              name="isActive"
              checked={formState.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Active
          </label>

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
              {isSaving ? "Saving..." : actionLabel}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

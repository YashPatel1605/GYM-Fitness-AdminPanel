"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";

const FAQ_API_URL = "https://gym-fitness-backend-lnmr.onrender.com/api/faq";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFaqs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(FAQ_API_URL);
      if (!response.ok) {
        throw new Error("Failed to load FAQ items.");
      }
      const result = await response.json();
      setFaqs(result.data || []);
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

  const resetForm = () => {
    setSelectedFaq(null);
    setFormState(initialFormState);
    setMessage(null);
    setError(null);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value, type } = target;
    const checked =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : undefined;
    const key = name as keyof FormState;

    setFormState((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? (checked as boolean) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...formState,
        order: selectedFaq ? selectedFaq.order : faqs.length + 1,
      };

      const url = selectedFaq
        ? `${FAQ_API_URL}/${selectedFaq._id}`
        : FAQ_API_URL;
      const method = selectedFaq ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          body || "Failed to save the FAQ. Please try again."
        );
      }

      const result = await response.json();
      const savedFaq: FaqItem = result.data || result;

      setFaqs((current) => {
        if (selectedFaq) {
          return current.map((faq) =>
            faq._id === savedFaq._id ? savedFaq : faq
          );
        }
        return [savedFaq, ...current];
      });

      setMessage(
        selectedFaq ? "FAQ updated successfully." : "FAQ added successfully."
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save FAQ.");
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
    setMessage(null);
    setError(null);
  };

  const handleDelete = async (faqId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this FAQ item?"
    );
    if (!confirmDelete) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${FAQ_API_URL}/${faqId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to delete FAQ.");
      }

      setFaqs((current) => current.filter((faq) => faq._id !== faqId));
      setMessage("FAQ deleted successfully.");
      if (selectedFaq?._id === faqId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const actionLabel = selectedFaq ? "Update FAQ" : "Add FAQ";

  const activeFaqs = useMemo(
    () => faqs.sort((a, b) => a.order - b.order),
    [faqs]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <ComponentCard
          title={selectedFaq ? "Edit FAQ" : "Add FAQ"}
          desc="Create or update FAQ items that appear in the admin FAQ section."
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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

            <div className="flex items-center gap-3">
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
            </div>

            {message && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                {message}
              </div>
            )}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="w-4 h-4 mr-2" />
                {actionLabel}
              </button>
              {selectedFaq && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </ComponentCard>

        <ComponentCard
          title="FAQ Overview"
          desc="View FAQ items and manage them with edit / delete actions."
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total FAQs
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {faqs.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <Plus className="w-4 h-4" />
              New FAQ
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
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Loading FAQs...
                      </td>
                    </tr>
                  ) : activeFaqs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No FAQ items found.
                      </td>
                    </tr>
                  ) : (
                    activeFaqs.map((faq) => (
                      <tr key={faq._id}>
                        <td className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                          {faq.question}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[320px] truncate">
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
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(faq._id)}
                              className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
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
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Dumbbell,
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

type Exercise = {
  _id?: string;
  name: string;
  sets: number;
  reps: string;
};

type Program = {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  durationWeeks: number;
  totalExercises: number;
  frequencyPerWeek: number;
  shortDescription: string;
  fullDescription: string;
  image: string;
  categories: string[];
  benefits: string[];
  exercisesList: Exercise[];
  createdAt: string;
  updatedAt: string;
};

type ProgramResponse = {
  success?: boolean;
  count?: number;
  data: Program[] | Program;
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
  difficulty: string;
  durationWeeks: string;
  totalExercises: string;
  frequencyPerWeek: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  categories: string;
  benefits: string;
  exercisesList: Exercise[];
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const initialExercise: Exercise = {
  name: "",
  sets: 3,
  reps: "",
};

const initialFormState: FormState = {
  title: "",
  slug: "",
  difficulty: "Beginner",
  durationWeeks: "4",
  totalExercises: "0",
  frequencyPerWeek: "3",
  shortDescription: "",
  fullDescription: "",
  image: "",
  categories: "",
  benefits: "",
  exercisesList: [{ ...initialExercise }],
};

const difficultyColor: Record<string, "success" | "warning" | "error" | "info"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "error",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const splitList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (items: string[] = []) => items.join(", ");

const toNumber = (value: string, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export default function ProgramManager() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const loadPrograms = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<ProgramResponse>("/programs");
      setPrograms(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch Programs data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
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
    setSelectedProgram(null);
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

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      exercisesList: prev.exercisesList.map((exercise, currentIndex) =>
        currentIndex === index
          ? {
              ...exercise,
              [field]: field === "sets" ? toNumber(value, 0) : value,
            }
          : exercise
      ),
    }));
  };

  const addExerciseRow = () => {
    setFormState((prev) => ({
      ...prev,
      exercisesList: [...prev.exercisesList, { ...initialExercise }],
    }));
  };

  const removeExerciseRow = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      exercisesList:
        prev.exercisesList.length === 1
          ? [{ ...initialExercise }]
          : prev.exercisesList.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const exercises = formState.exercisesList
      .map((exercise) => ({
        name: exercise.name.trim(),
        sets: Number(exercise.sets) || 0,
        reps: exercise.reps.trim(),
      }))
      .filter((exercise) => exercise.name && exercise.reps);

    try {
      const isEditing = Boolean(selectedProgram);
      const payload = {
        title: formState.title.trim(),
        slug: formState.slug.trim() || slugify(formState.title),
        difficulty: formState.difficulty,
        durationWeeks: toNumber(formState.durationWeeks),
        totalExercises:
          toNumber(formState.totalExercises) || exercises.length,
        frequencyPerWeek: toNumber(formState.frequencyPerWeek),
        shortDescription: formState.shortDescription.trim(),
        fullDescription: formState.fullDescription.trim(),
        image: formState.image.trim(),
        categories: splitList(formState.categories),
        benefits: splitList(formState.benefits),
        exercisesList: exercises,
      };

      const result = isEditing
        ? await apiClient.put<ProgramResponse>(
            `/programs/${selectedProgram?._id}`,
            payload
          )
        : await apiClient.post<ProgramResponse>("/programs", payload);
      const savedProgram = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

      setPrograms((current) => {
        if (selectedProgram) {
          return current.map((program) =>
            program._id === savedProgram._id ? savedProgram : program
          );
        }

        return [savedProgram, ...current];
      });
      showToast(
        "success",
        result.message ||
          `Program "${savedProgram.title}" ${
            isEditing ? "updated" : "added"
          } successfully.`
      );
      closeModal();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save Program.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormState({
      title: program.title,
      slug: program.slug,
      difficulty: program.difficulty || "Beginner",
      durationWeeks: String(program.durationWeeks ?? ""),
      totalExercises: String(program.totalExercises ?? ""),
      frequencyPerWeek: String(program.frequencyPerWeek ?? ""),
      shortDescription: program.shortDescription || "",
      fullDescription: program.fullDescription || "",
      image: program.image || "",
      categories: joinList(program.categories),
      benefits: (program.benefits || []).join("\n"),
      exercisesList:
        program.exercisesList?.length > 0
          ? program.exercisesList.map((exercise) => ({
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
            }))
          : [{ ...initialExercise }],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (programId: string) => {
    const programToDelete = programs.find((program) => program._id === programId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Program?"
    );

    if (!confirmDelete) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<ProgramResponse>(
        `/programs/${programId}`
      );
      setPrograms((current) =>
        current.filter((program) => program._id !== programId)
      );
      showToast(
        "success",
        result.message ||
          `Program "${programToDelete?.title || "item"}" deleted successfully.`
      );

      if (selectedProgram?._id === programId) {
        closeModal();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete Program.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const actionLabel = selectedProgram ? "Update Program" : "Add Program";
  const sortedPrograms = useMemo(
    () =>
      [...programs].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [programs]
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
          <p className="text-sm font-medium text-brand-500">
            Programs Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Workout Programs
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            List, create, update, and delete Programs using your backend API.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Programs
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {programs.length}
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
            Add Program
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Program
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Difficulty
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Schedule
                  </th>
                  <th className="px-5 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Categories
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
                      Loading Programs...
                    </td>
                  </tr>
                ) : sortedPrograms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No Programs found.
                    </td>
                  </tr>
                ) : (
                  sortedPrograms.map((program) => (
                    <tr key={program._id}>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
                            <Dumbbell className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {program.title}
                            </p>
                            <p className="mt-1 max-w-[360px] truncate text-sm text-gray-500 dark:text-gray-400">
                              {program.shortDescription}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <Badge
                          color={difficultyColor[program.difficulty] || "info"}
                          variant="light"
                          size="sm"
                        >
                          {program.difficulty}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="block text-gray-800 dark:text-white/90">
                          {program.durationWeeks} weeks
                        </span>
                        <span>
                          {program.frequencyPerWeek} days/week |{" "}
                          {program.totalExercises} exercises
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex max-w-[260px] flex-wrap gap-2">
                          {program.categories?.length > 0 ? (
                            program.categories.map((category) => (
                              <Badge key={category} color="light" size="sm">
                                {category}
                              </Badge>
                            ))
                          ) : (
                            <span>No categories</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(program)}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(program._id)}
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
        className="mx-3 my-4 max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl p-0 sm:mx-4 sm:my-6 sm:max-h-[calc(100dvh-3rem)] sm:w-full"
      >
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4 pr-16 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-5">
          <p className="text-sm font-medium text-brand-500">
            {selectedProgram ? "Edit Program" : "Add Program"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedProgram ? "Update Program Details" : "Create New Program"}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="block"
        >
          <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input
                required
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Mass Builder Pro"
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

            <Field label="Difficulty">
              <select
                name="difficulty"
                value={formState.difficulty}
                onChange={handleInputChange}
                className={inputClassName}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </Field>

            <Field label="Image Path">
              <input
                name="image"
                value={formState.image}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="/images/Programs/GYM1.jpg"
              />
            </Field>

            <Field label="Duration Weeks">
              <input
                required
                min="1"
                name="durationWeeks"
                type="number"
                value={formState.durationWeeks}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </Field>

            <Field label="Frequency Per Week">
              <input
                required
                min="1"
                name="frequencyPerWeek"
                type="number"
                value={formState.frequencyPerWeek}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </Field>

            <Field label="Total Exercises">
              <input
                min="0"
                name="totalExercises"
                type="number"
                value={formState.totalExercises}
                onChange={handleInputChange}
                className={inputClassName}
              />
            </Field>

            <Field label="Categories">
              <input
                name="categories"
                value={formState.categories}
                onChange={handleInputChange}
                className={inputClassName}
                placeholder="Beginner, Weight Loss"
              />
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
              placeholder="Detailed program description"
            />
          </Field>

          <Field label="Benefits">
            <textarea
              name="benefits"
              rows={4}
              value={formState.benefits}
              onChange={handleInputChange}
              className={textareaClassName}
              placeholder="One benefit per line"
            />
          </Field>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exercises
              </label>
              <button
                type="button"
                onClick={addExerciseRow}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add Exercise
              </button>
            </div>

            <div className="space-y-3">
              {formState.exercisesList.map((exercise, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 sm:grid-cols-[1fr_96px_120px_auto] lg:grid-cols-[1fr_110px_140px_auto]"
                >
                  <input
                    value={exercise.name}
                    onChange={(event) =>
                      handleExerciseChange(index, "name", event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Exercise name"
                  />
                  <input
                    min="0"
                    type="number"
                    value={exercise.sets}
                    onChange={(event) =>
                      handleExerciseChange(index, "sets", event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Sets"
                  />
                  <input
                    value={exercise.reps}
                    onChange={(event) =>
                      handleExerciseChange(index, "reps", event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Reps"
                  />
                  <button
                    type="button"
                    onClick={() => removeExerciseRow(index)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-300 dark:hover:bg-red-900"
                    aria-label="Remove exercise"
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

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock3,
  Edit3,
  Flame,
  Plus,
  Save,
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

type Recipe = {
  _id: string;
  title: string;
  category: string;
  categoryColor: string;
  calories: number;
  time: number;
  protein: number;
  description: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  createdAt: string;
  updatedAt: string;
};

type RecipeResponse = {
  success?: boolean;
  message?: string;
  count?: number;
  data?: Recipe[] | Recipe;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

type FormState = {
  title: string;
  category: string;
  categoryColor: string;
  calories: string;
  time: string;
  protein: string;
  description: string;
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
};

type ToastState = {
  type: "success" | "error";
  message: string;
};

const pageSize = 10;
const inlineImageLimitKB = 80;

const initialFormState: FormState = {
  title: "",
  category: "",
  categoryColor: "red",
  calories: "0",
  time: "15",
  protein: "0",
  description: "",
  imageUrl: "",
  ingredients: [""],
  instructions: [""],
};

const badgeColorByCategoryColor: Record<
  string,
  "primary" | "success" | "error" | "warning" | "info" | "light"
> = {
  blue: "info",
  green: "success",
  orange: "warning",
  red: "error",
  purple: "primary",
  gray: "light",
};

const cleanList = (items: string[] = []) =>
  items.map((item) => item.trim()).filter(Boolean);

const ensureListInputs = (items: string[] = []) =>
  items.length > 0 ? [...items] : [""];

const toNumber = (value: string, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const getApproxKB = (value: string) => Math.ceil(value.length / 1024);

const isInlineImage = (value: string) => value.startsWith("data:image/");

const isRecipe = (value: unknown): value is Recipe =>
  Boolean(
    value &&
      typeof value === "object" &&
      "_id" in value &&
      "title" in value
  );

const normalizeRecipes = (data: RecipeResponse["data"]) => {
  if (Array.isArray(data)) {
    return data.filter(isRecipe);
  }

  return isRecipe(data) ? [data] : [];
};

export default function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadRecipes = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<RecipeResponse>(
        `/recipes?page=${page}&limit=${pageSize}`
      );

      setRecipes(normalizeRecipes(result.data));
      setTotalRecipes(result.meta?.total ?? result.count ?? 0);
      setTotalPages(Math.max(result.meta?.totalPages ?? 1, 1));
      setCurrentPage(result.meta?.page ?? page);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch Recipes data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes(currentPage);
  }, [currentPage, loadRecipes]);

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
    setSelectedRecipe(null);
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

  const handleImageChange = (imageUrl: string) => {
    setFormState((prev) => ({
      ...prev,
      imageUrl,
    }));
  };

  const handleListItemChange = (
    field: "ingredients" | "instructions",
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

  const addListItem = (field: "ingredients" | "instructions") => {
    setFormState((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeListItem = (
    field: "ingredients" | "instructions",
    index: number
  ) => {
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
    category: formState.category.trim(),
    categoryColor: formState.categoryColor,
    calories: toNumber(formState.calories),
    time: toNumber(formState.time),
    protein: toNumber(formState.protein),
    description: formState.description.trim(),
    imageUrl: formState.imageUrl.trim(),
    ingredients: cleanList(formState.ingredients),
    instructions: cleanList(formState.instructions),
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

    if (
      isInlineImage(formState.imageUrl) &&
      getApproxKB(formState.imageUrl) > inlineImageLimitKB
    ) {
      const errorMessage =
        "Recipe image is too large. Please re-upload the image so it can be optimized.";

      setError(errorMessage);
      showToast("error", errorMessage);
      setIsSaving(false);
      return;
    }

    try {
      const isEditing = Boolean(selectedRecipe);
      const result = isEditing
        ? await apiClient.put<RecipeResponse>(
            `/recipes/${selectedRecipe?._id}`,
            buildPayload()
          )
        : await apiClient.post<RecipeResponse>("/recipes", buildPayload());
      const savedRecipe = normalizeRecipes(result.data)[0];

      showToast(
        "success",
        result.message ||
          `Recipe "${savedRecipe?.title || formState.title}" ${
            isEditing ? "updated" : "added"
          } successfully.`
      );
      closeModal();
      await loadRecipes(isEditing ? currentPage : 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save Recipe.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setFormState({
      title: recipe.title || "",
      category: recipe.category || "",
      categoryColor: recipe.categoryColor || "red",
      calories: String(recipe.calories ?? ""),
      time: String(recipe.time ?? ""),
      protein: String(recipe.protein ?? ""),
      description: recipe.description || "",
      imageUrl: recipe.imageUrl || "",
      ingredients: ensureListInputs(recipe.ingredients),
      instructions: ensureListInputs(recipe.instructions),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (recipeId: string) => {
    const recipeToDelete = recipes.find((recipe) => recipe._id === recipeId);
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Recipe?"
    );

    if (!confirmDelete) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await apiClient.delete<RecipeResponse>(
        `/recipes/${recipeId}`
      );
      const nextPage =
        recipes.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      showToast(
        "success",
        result.message ||
          `Recipe "${recipeToDelete?.title || "item"}" deleted successfully.`
      );
      await loadRecipes(nextPage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to delete Recipe.";

      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedRecipes = useMemo(
    () =>
      recipes.filter(isRecipe).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [recipes]
  );

  const actionLabel = selectedRecipe ? "Update Recipe" : "Add Recipe";

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
            Recipes Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Nutrition Recipes
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            List, create, update, and delete Recipes using your backend API.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Recipes
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            {totalRecipes}
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
            Add Recipe
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <tr>
                  <th className="w-[36%] px-3 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Recipe
                  </th>
                  <th className="w-[13%] px-3 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="w-[15%] px-3 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nutrition
                  </th>
                  <th className="w-[15%] px-3 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Details
                  </th>
                  <th className="w-[21%] px-3 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                      Loading Recipes...
                    </td>
                  </tr>
                ) : sortedRecipes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No Recipes found.
                    </td>
                  </tr>
                ) : (
                  sortedRecipes.map((recipe) => (
                    <tr key={recipe._id} className="align-top">
                      <td className="px-3 py-5">
                        <div className="flex min-w-0 items-start gap-3">
                          <ImageViewer
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="h-18 w-18"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
                              {recipe.title}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                              {recipe.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex max-w-full items-center">
                          <Badge
                            color={
                              badgeColorByCategoryColor[recipe.categoryColor] ||
                              "light"
                            }
                            variant="light"
                            size="sm"
                          >
                            <span className="max-w-[92px] truncate">
                              {recipe.category || "General"}
                            </span>
                          </Badge>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-500 dark:bg-error-500/15">
                              <Flame className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {recipe.calories}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                calories
                              </p>
                            </div>
                          </div>
                          <div className="truncate rounded-lg bg-gray-50 px-2.5 py-2 text-xs font-medium text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                            {recipe.protein}g protein
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2 dark:border-gray-800 dark:bg-white/[0.03]">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
                              <Clock3 className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {recipe.time} min
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                prep time
                              </p>
                            </div>
                          </div>
                          <div className="truncate rounded-lg bg-gray-50 px-2.5 py-2 text-xs font-medium text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
                            {recipe.ingredients?.length || 0} ingredients
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-end text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(recipe)}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <Edit3 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(recipe._id)}
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
            {selectedRecipe ? "Edit Recipe" : "Add Recipe"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            {selectedRecipe ? "Update Recipe Details" : "Create New Recipe"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="block">
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <ImageUpload
              label="Upload Recipe Image"
              value={formState.imageUrl}
              onChange={handleImageChange}
              onUploadingChange={setIsImageUploading}
              helperText="Use a clear recipe cover image. PNG, JPG, WebP, or SVG up to 5 MB."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  required
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="Grilled Chicken Power Bowl"
                />
              </Field>

              <Field label="Category">
                <input
                  required
                  name="category"
                  value={formState.category}
                  onChange={handleInputChange}
                  className={inputClassName}
                  placeholder="High Protein"
                />
              </Field>

              <Field label="Category Color">
                <select
                  name="categoryColor"
                  value={formState.categoryColor}
                  onChange={handleInputChange}
                  className={inputClassName}
                >
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="orange">Orange</option>
                  <option value="purple">Purple</option>
                  <option value="gray">Gray</option>
                </select>
              </Field>

              <Field label="Calories">
                <input
                  min="0"
                  name="calories"
                  type="number"
                  value={formState.calories}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>

              <Field label="Time">
                <input
                  min="0"
                  name="time"
                  type="number"
                  value={formState.time}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>

              <Field label="Protein">
                <input
                  min="0"
                  name="protein"
                  type="number"
                  value={formState.protein}
                  onChange={handleInputChange}
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                required
                name="description"
                rows={3}
                value={formState.description}
                onChange={handleInputChange}
                className={textareaClassName}
                placeholder="Short recipe description"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <ListInputGroup
                label="Ingredients"
                addLabel="Add Ingredient"
                removeLabel="Remove ingredient"
                items={formState.ingredients}
                placeholder="200g grilled chicken breast"
                onAdd={() => addListItem("ingredients")}
                onChange={(index, value) =>
                  handleListItemChange("ingredients", index, value)
                }
                onRemove={(index) => removeListItem("ingredients", index)}
              />

              <ListInputGroup
                label="Instructions"
                addLabel="Add Step"
                removeLabel="Remove instruction"
                items={formState.instructions}
                placeholder="Grill chicken until cooked through"
                onAdd={() => addListItem("instructions")}
                onChange={(index, value) =>
                  handleListItemChange("instructions", index, value)
                }
                onRemove={(index) => removeListItem("instructions", index)}
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

function ListInputGroup({
  label,
  addLabel,
  removeLabel,
  items,
  placeholder,
  onAdd,
  onChange,
  onRemove,
}: {
  label: string;
  addLabel: string;
  removeLabel: string;
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
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
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
              aria-label={removeLabel}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

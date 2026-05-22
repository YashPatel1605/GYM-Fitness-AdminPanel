import type { Metadata } from "next";
import FaqManager from "@/components/faq/FaqManager";

export const metadata: Metadata = {
  title: "FAQ Management | Gym Fitness Admin",
  description: "Manage frequently asked questions for the gym fitness admin panel.",
};

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">FAQ Management</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create, edit, and delete FAQ items using your backend API.
          </p>
        </div>
      </div>

      <FaqManager />
    </div>
  );
}

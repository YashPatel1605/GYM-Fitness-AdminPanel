"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

import {
  BadgeHelp,
  ChefHat,
  CreditCard,
  Dumbbell,
  HandPlatter,
  UsersRound,
} from "lucide-react";

type CountKey =
  | "programs"
  | "plans"
  | "recipes"
  | "services"
  | "faqs"
  | "trainers";

type CountsData = Record<CountKey, number> & {
  total?: number;
};

type CountsResponse = {
  success?: boolean;
  data?: Partial<CountsData>;
  programs?: number;
  plans?: number;
  recipes?: number;
  services?: number;
  faqs?: number;
  trainers?: number;
  total?: number;
  message?: string;
};

const metricsData: {
  id: number;
  title: string;
  countKey: CountKey;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  cardClassName: string;
}[] = [
  {
    id: 1,
    title: "Programs",
    countKey: "programs",
    href: "/programs",
    Icon: Dumbbell,
    iconClassName: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
    cardClassName: "hover:border-blue-200 dark:hover:border-blue-500/40",
  },
  {
    id: 2,
    title: "Membership-Plan",
    countKey: "plans",
    href: "/membership-plan",
    Icon: CreditCard,
    iconClassName:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
    cardClassName: "hover:border-emerald-200 dark:hover:border-emerald-500/40",
  },
  {
    id: 3,
    title: "Recipes",
    countKey: "recipes",
    href: "/recipes",
    Icon: ChefHat,
    iconClassName:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
    cardClassName: "hover:border-amber-200 dark:hover:border-amber-500/40",
  },
  {
    id: 4,
    title: "Services",
    countKey: "services",
    href: "/services",
    Icon: HandPlatter,
    iconClassName:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
    cardClassName: "hover:border-purple-200 dark:hover:border-purple-500/40",
  },
  {
    id: 5,
    title: "Faqs",
    countKey: "faqs",
    href: "/faq",
    Icon: BadgeHelp,
    iconClassName: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
    cardClassName: "hover:border-rose-200 dark:hover:border-rose-500/40",
  },
  {
    id: 6,
    title: "Trainers",
    countKey: "trainers",
    href: "/trainers",
    Icon: UsersRound,
    iconClassName:
      "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    cardClassName: "hover:border-cyan-200 dark:hover:border-cyan-500/40",
  },
];

export const EcommerceMetrics = () => {
  const [counts, setCounts] = useState<Partial<CountsData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiClient.get<CountsResponse>("/counts");
        setCounts(result.data ?? result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to fetch dashboard counts."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCounts();
  }, []);

  const formatCount = (value?: number) =>
    new Intl.NumberFormat("en-IN").format(value ?? 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricsData.map((metric) => {
          return (
            <Link
              key={metric.id}
              href={metric.href}
              className={`group rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-theme-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-white/[0.03] ${metric.cardClassName}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${metric.iconClassName}`}
                >
                  <metric.Icon className="size-5" />
                </div>

                <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 transition group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-white/[0.04] dark:text-gray-400 dark:group-hover:bg-brand-500/10 dark:group-hover:text-brand-300">
                  View
                </span>
              </div>

              <div className="mt-4">
                <span className="block truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </span>
                <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {isLoading ? "..." : formatCount(counts[metric.countKey])}
                </h4>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

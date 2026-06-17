"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import ImageViewer from "@/components/common/ImageViewer";
import apiClient from "@/lib/apiClient";

type Member = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  authProvider?: string;
  membership?: {
    planType?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

type MembersResponse = {
  success?: boolean;
  message?: string;
  users?: Member[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
};

const isMember = (value: unknown): value is Member =>
  Boolean(
    value &&
      typeof value === "object" &&
      "_id" in value &&
      "name" in value &&
      "email" in value
  );

const formatShortDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatPlanType = (value?: string) => {
  if (!value || value === "NONE") {
    return "No Plan";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const isActiveMembership = (status?: string) =>
  status?.toLowerCase() === "active";

export default function MembersManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<MembersResponse["meta"]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<MembersResponse>("/auth/users");
      setMembers(Array.isArray(result.users) ? result.users.filter(isMember) : []);
      setMeta(result.meta);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch members data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const sortedMembers = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [members]
  );

  const totalMembers = meta?.total ?? members.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-500">
            Members Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            User Details
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View Google login users from your backend API.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_auto]">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Members
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {totalMembers}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-right dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {meta?.page ?? 1}/{meta?.totalPages ?? 1}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <ComponentCard title="" desc="">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadMembers}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-white/[0.05] dark:bg-gray-900/70">
                <tr>
                  <th className="w-[40%] px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:px-5">
                    Member
                  </th>
                  <th className="w-[20%] px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:px-5">
                    Membership
                  </th>
                  <th className="w-[24%] px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:px-5">
                    Validity
                  </th>
                  <th className="w-[16%] px-4 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:px-5">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Loading Members...
                    </td>
                  </tr>
                ) : sortedMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No Members found.
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((member) => {
                    const membership = member.membership;
                    const isActive = isActiveMembership(membership?.status);

                    return (
                      <tr
                        key={member._id}
                        className="align-top transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.04]"
                      >
                        <td className="px-4 py-5 xl:px-5">
                          <div className="flex min-w-0 items-center gap-3 xl:gap-4">
                            <ImageViewer
                              src={member.avatar}
                              alt={member.name}
                              className="h-12 w-12 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900 xl:h-14 xl:w-14"
                              imageClassName="rounded-full"
                              fallbackClassName="rounded-full"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-gray-800 dark:text-white/90">
                                {member.name}
                              </p>
                              <a
                                href={`mailto:${member.email}`}
                                className="mt-2 inline-flex max-w-full items-center gap-2 truncate text-sm text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-300"
                              >
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </a>
                              <span className="mt-2 inline-flex max-w-full items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  Joined {formatShortDate(member.createdAt)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400 xl:px-5">
                          <div className="flex min-w-0 flex-col items-start gap-2">
                            <Badge
                              color={
                                membership?.planType &&
                                membership.planType !== "NONE"
                                  ? "primary"
                                  : "light"
                              }
                              variant="light"
                              size="sm"
                            >
                              {formatPlanType(membership?.planType)}
                            </Badge>
                            <Badge
                              color={isActive ? "success" : "error"}
                              variant="light"
                              size="sm"
                            >
                              {isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-sm xl:px-5">
                          <div className="flex min-w-0 flex-col gap-2">
                            <span className="inline-flex min-w-0 items-center gap-2 text-gray-600 dark:text-gray-300">
                              <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="min-w-0 truncate">
                                Start:{" "}
                                {formatShortDate(
                                  membership?.startDate ?? undefined
                                )}
                              </span>
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-2 font-medium text-error-600 dark:text-error-500">
                              <CalendarDays className="h-4 w-4 shrink-0 text-error-500" />
                              <span className="min-w-0 truncate">
                                End:{" "}
                                {formatShortDate(
                                  membership?.endDate ?? undefined
                                )}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400 xl:px-5">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="truncate">
                              {formatShortDate(member.updatedAt)}
                            </span>
                          </span>
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
    </div>
  );
}

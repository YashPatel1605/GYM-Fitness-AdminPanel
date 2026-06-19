"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import apiClient from "@/lib/apiClient";
import { getAuthToken, isTokenValid, saveSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  admin: {
    email: string;
    role: string;
  };
};

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isTokenValid(getAuthToken())) router.replace("/");
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<LoginResponse>("/admin/login", {
        email: email.trim(),
        password,
      });

      if (!response.success || !response.token) {
        throw new Error(response.message || "Unable to sign in.");
      }

      saveSession(response.token, response.admin);
      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col px-0 py-10 sm:px-8 lg:w-1/2 lg:px-12">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-500 text-white shadow-lg shadow-error-500/20">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2">
              <path d="M4 10v4M7 7v10M17 7v10M20 10v4M7 12h10" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Gym Fitness</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin management portal</p>
          </div>
        </div>
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-error-500">SECURE ADMIN ACCESS</p>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage your Gym Fitness operations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="email">
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">
                Password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-error-50 p-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-error-500 shadow-lg shadow-error-500/20 hover:bg-error-600 disabled:bg-error-400"
              size="sm"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
              )}
              {isSubmitting ? "Signing you in..." : "Sign in to dashboard"}
            </Button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Protected access for authorized Gym Fitness administrators.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import React from "react";

const adminHighlights = [
  ["Members", "Stay connected"],
  ["Programs", "Plan smarter"],
  ["Growth", "Track progress"],
] as const;

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 min-h-screen bg-white p-6 dark:bg-gray-950 sm:p-0">
      <ThemeProvider>
        <div className="relative flex min-h-screen w-full flex-col justify-center dark:bg-gray-950 lg:flex-row sm:p-0">
          {children}
          <aside className="relative hidden min-h-screen w-full items-center overflow-hidden bg-[#111827] lg:grid lg:w-1/2">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-error-500/20 blur-3xl" />
            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="relative z-1 flex items-center justify-center px-12">
              <GridShape />
              <div className="flex max-w-lg flex-col items-center text-center">
                <Image
                  width={520}
                  height={130}
                  className="mb-8 h-auto w-full max-w-[360px]"
                  src="/images/logo/GymLogo1.png"
                  alt="Gym Fitness"
                  priority
                />
                <div className="mb-7 h-1 w-16 rounded-full bg-error-500" />
                <h2 className="mb-4 text-3xl font-semibold text-white">
                  Run your gym with confidence
                </h2>
                <p className="max-w-md text-base leading-7 text-gray-300">
                  Manage members, trainers, programs, recipes, services, and
                  memberships from one focused Gym Fitness admin workspace.
                </p>
                <div className="mt-10 grid w-full grid-cols-3 gap-3 text-left">
                  {adminHighlights.map(([title, description]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    >
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs text-gray-400">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

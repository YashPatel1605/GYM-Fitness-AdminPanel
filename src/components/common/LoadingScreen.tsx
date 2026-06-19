type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({
  message = "Preparing your admin workspace...",
}: LoadingScreenProps) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-6 dark:bg-gray-950"
      role="status"
      aria-live="polite"
    >
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-error-500/10 blur-3xl" />
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-2xl border border-gray-200 bg-white/90 px-8 py-10 text-center shadow-theme-xl backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-gray-200 border-t-error-500 dark:border-gray-700 dark:border-t-error-500" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-500 text-white shadow-lg shadow-error-500/25">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-none stroke-current"
              strokeWidth="2"
            >
              <path
                d="M4 10v4M7 7v10M17 7v10M20 10v4M7 12h10"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Gym Fitness
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
        <div className="mt-6 flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error-500" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error-500 [animation-delay:300ms]" />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}

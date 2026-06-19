"use client";

import { getAuthToken, isTokenValid, redirectToSignIn } from "@/lib/auth";
import LoadingScreen from "@/components/common/LoadingScreen";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const subscribeToSession = (onStoreChange: () => void) => {
  window.addEventListener("storage", onStoreChange);
  const expiryCheck = window.setInterval(onStoreChange, 30_000);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.clearInterval(expiryCheck);
  };
};

const getSessionSnapshot = () => isTokenValid(getAuthToken());
const getServerSessionSnapshot = () => false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthenticated = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );

  useEffect(() => {
    if (!isAuthenticated) redirectToSignIn();
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated) {
    return <LoadingScreen message="Checking your secure session..." />;
  }

  return children;
}

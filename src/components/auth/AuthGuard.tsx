"use client";

import { getAuthToken, isTokenValid, redirectToSignIn } from "@/lib/auth";
import LoadingScreen from "@/components/common/LoadingScreen";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const hasValidSession = isTokenValid(getAuthToken());
      setIsAuthenticated(hasValidSession);

      if (!hasValidSession) {
        redirectToSignIn();
      }
    };

    checkSession();

    window.addEventListener("storage", checkSession);
    const expiryCheck = window.setInterval(checkSession, 30_000);

    return () => {
      window.removeEventListener("storage", checkSession);
      window.clearInterval(expiryCheck);
    };
  }, [pathname]);

  if (!isAuthenticated) {
    return <LoadingScreen message="Checking your secure session..." />;
  }

  return children;
}

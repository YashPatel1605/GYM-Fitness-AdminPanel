export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_ADMIN_KEY = "authAdmin";

export type AdminUser = {
  email: string;
  role: string;
};

type JwtPayload = {
  exp?: number;
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const base64 = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((character) =>
          `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem("token");
};

export const isTokenValid = (token: string | null) => {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now();
};

export const saveSession = (token: string, admin: AdminUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(admin));
  localStorage.removeItem("token");
};

export const clearSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ADMIN_KEY);
  localStorage.removeItem("token");
};

export const redirectToSignIn = () => {
  if (typeof window === "undefined") return;
  clearSession();
  window.location.replace("/signin");
};

const API_BASE_URL = "https://gym-fitness-backend-lnmr.onrender.com/api";

type ApiClientOptions = RequestInit & {
  authToken?: string;
};

type ApiBody = unknown;

const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token") || localStorage.getItem("authToken");
};

const buildUrl = (endpoint: string) => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

async function fetchApi<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { authToken, headers, body, ...restOptions } = options;
  const token = authToken ?? getAuthToken();
  const requestHeaders = new Headers(headers);

  if (
    body &&
    !(body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(endpoint), {
    ...restOptions,
    body,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String(data.message)
        : typeof data === "string" && data
          ? data
          : "Something went wrong. Please try again.";

    throw new Error(message);
  }

  return data as T;
}

const request = <T>(
  method: string,
  endpoint: string,
  data?: ApiBody,
  options: ApiClientOptions = {}
) => {
  const isFormData = data instanceof FormData;
  const hasBody = data !== undefined && data !== null;

  return fetchApi<T>(endpoint, {
    ...options,
    method,
    body: hasBody ? (isFormData ? data : JSON.stringify(data)) : undefined,
  });
};

const client = {
  get: <T>(endpoint: string, options?: ApiClientOptions) =>
    request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, data?: ApiBody, options?: ApiClientOptions) =>
    request<T>("POST", endpoint, data, options),
  put: <T>(endpoint: string, data?: ApiBody, options?: ApiClientOptions) =>
    request<T>("PUT", endpoint, data, options),
  patch: <T>(endpoint: string, data?: ApiBody, options?: ApiClientOptions) =>
    request<T>("PATCH", endpoint, data, options),
  delete: <T>(endpoint: string, options?: ApiClientOptions) =>
    request<T>("DELETE", endpoint, undefined, options),
};

export default client;

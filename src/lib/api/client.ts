import { appConfig } from "@/lib/config";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  formData?: FormData;
};

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", token, body, query, formData } = options;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${appConfig.apiUrl}${path}${buildQuery(query)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      `Tidak dapat terhubung ke backend di ${appConfig.apiUrl}. Pastikan server backend berjalan (npm run start:dev di folder backend) dan CORS mengizinkan origin browser Anda.`,
      "NETWORK_ERROR",
      0,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson
    ? ((await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse)
    : null;

  if (!response.ok || (payload && "success" in payload && !payload.success)) {
    const errorBody =
      payload && "success" in payload && !payload.success
        ? payload
        : ({
            success: false as const,
            error: `HTTP ${response.status}`,
            code: "HTTP_ERROR",
          } satisfies ApiErrorResponse);

    throw new ApiError(
      errorBody.error,
      errorBody.code,
      response.status,
      errorBody.details,
    );
  }

  if (payload && "success" in payload && payload.success) {
    return payload.data;
  }

  return (payload ?? (await response.text())) as T;
}

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const data = await apiRequest<{ status: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

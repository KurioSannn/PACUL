import { ApiError } from "@/lib/api/client";

export function getErrorMessage(err: unknown, fallback = "Gagal memuat data. Coba lagi."): string {
  if (err instanceof ApiError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

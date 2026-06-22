"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/** Ambil access token terbaru; refresh otomatis jika hampir/sudah expired. */
export async function getFreshAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    return null;
  }

  const session = sessionData.session;
  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  const shouldRefresh = expiresAtMs - Date.now() < 120_000;

  if (!shouldRefresh) {
    return session.access_token;
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    return null;
  }

  return refreshed.session.access_token;
}

/** Validasi sesi dengan Supabase; refresh jika perlu. */
export async function validateAndRefreshSession(): Promise<{
  accessToken: string | null;
  signedOut: boolean;
}> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return { accessToken: null, signedOut: false };
  }

  const { error: userError } = await supabase.auth.getUser();
  if (userError) {
    await supabase.auth.signOut();
    return { accessToken: null, signedOut: true };
  }

  const token = await getFreshAccessToken();
  return { accessToken: token, signedOut: false };
}

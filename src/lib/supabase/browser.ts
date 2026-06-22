"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appConfig } from "@/lib/config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!appConfig.isSupabaseConfigured) {
    throw new Error(
      "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local",
    );
  }

  if (!browserClient) {
    browserClient = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

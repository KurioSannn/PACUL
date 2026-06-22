// Use direct property access so Next.js inlines NEXT_PUBLIC_* into the client bundle.
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").trim();
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
export const appConfig = {
  apiUrl: apiUrl.replace(/\/$/, ""),
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
} as const;

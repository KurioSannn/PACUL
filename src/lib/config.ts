// Use direct property access so Next.js inlines NEXT_PUBLIC_* into the client bundle.
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").trim();
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const devBypassAuth = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
export const appConfig = {
  apiUrl: apiUrl.replace(/\/$/, ""),
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  devBypassAuth,
} as const;

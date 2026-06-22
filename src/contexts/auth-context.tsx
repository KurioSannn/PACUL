"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, registerAuthTokenHandlers } from "@/lib/api/client";
import { completeProfile, getMe } from "@/lib/api/services";
import type { MeResponse, UserRole } from "@/lib/api/types";
import { appConfig } from "@/lib/config";
import {
  createDevFallbackProfile,
  DEV_DEMO_CREDENTIALS,
  getDevRole,
  setDevRole,
} from "@/lib/dev-auth-bypass";
import { getFreshAccessToken, validateAndRefreshSession } from "@/lib/supabase/session";
import { routes } from "@/lib/routes";

type AuthUser = {
  id: string;
  email?: string;
};

type AuthSession = {
  access_token: string;
  user: AuthUser;
};

async function getSupabase() {
  const { getSupabaseBrowserClient } = await import("@/lib/supabase/browser");
  return getSupabaseBrowserClient();
}

function normalizeSession(
  session: { access_token: string; user: { id: string; email?: string | null } } | null,
): AuthSession | null {
  if (!session?.user?.id) return null;
  return {
    access_token: session.access_token,
    user: {
      id: session.user.id,
      email: session.user.email ?? undefined,
    },
  };
}

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: MeResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<MeResponse | null>;
  completeOnboarding: (
    role: UserRole,
    payload: Record<string, unknown>,
  ) => Promise<MeResponse>;
  clearError: () => void;
  switchDevRole?: (role: UserRole) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const defaultAuthContext: AuthContextValue = {
  session: null,
  user: null,
  profile: null,
  accessToken: null,
  isLoading: true,
  isConfigured: false,
  error: null,
  signIn: async () => {
    throw new Error("Auth belum siap. Muat ulang halaman.");
  },
  signUp: async () => {
    throw new Error("Auth belum siap. Muat ulang halaman.");
  },
  signOut: async () => {},
  refreshProfile: async () => null,
  completeOnboarding: async () => {
    throw new Error("Auth belum siap. Muat ulang halaman.");
  },
  clearError: () => {},
  switchDevRole: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;

  const refreshProfile = useCallback(async (): Promise<MeResponse | null> => {
    const token = await getFreshAccessToken();
    if (!token) {
      setProfile(null);
      return null;
    }

    if (token !== accessToken) {
      setSession((prev) =>
        prev ? { ...prev, access_token: token } : prev,
      );
    }

    try {
      const me = await getMe(token);
      setProfile(me);
      return me;
    } catch (err) {
      if (appConfig.devBypassAuth) {
        const fallback = createDevFallbackProfile(getDevRole());
        setProfile(fallback);
        return fallback;
      }
      if (err instanceof ApiError && (err.status === 401 || err.code === "AUTH_REQUIRED")) {
        const supabase = await getSupabase();
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setError("Sesi login habis. Silakan masuk kembali.");
        return null;
      }
      if (err instanceof ApiError && err.code === "PROFILE_MISSING") {
        setProfile(null);
        return null;
      }
      throw err;
    }
  }, [accessToken]);

  useEffect(() => {
    registerAuthTokenHandlers({
      refreshToken: getFreshAccessToken,
      onExpired: () => {
        if (appConfig.devBypassAuth) return;
        void (async () => {
          const supabase = await getSupabase();
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          setError("Sesi login habis. Silakan masuk kembali.");
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
            window.location.href = `${routes.authLogin}?expired=1`;
          }
        })();
      },
    });
  }, []);

  const devAutoSignIn = useCallback(async (role: UserRole) => {
    const creds = DEV_DEMO_CREDENTIALS[role];
    if (!appConfig.isSupabaseConfigured) {
      setSession({
        access_token: "dev-bypass-token",
        user: { id: `dev-bypass-${role}`, email: creds.email },
      });
      setProfile(createDevFallbackProfile(role));
      return;
    }

    const supabase = await getSupabase();
    await supabase.auth.signOut();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });

    if (signInError || !data.session) {
      setSession({
        access_token: "dev-bypass-token",
        user: { id: `dev-bypass-${role}`, email: creds.email },
      });
      setProfile(createDevFallbackProfile(role));
      return;
    }

    setSession(normalizeSession(data.session));

    try {
      const me = await getMe(data.session.access_token);
      setProfile(me);
    } catch {
      setProfile(createDevFallbackProfile(role));
    }
  }, []);

  useEffect(() => {
    if (appConfig.devBypassAuth) {
      let active = true;
      void devAutoSignIn(getDevRole()).finally(() => {
        if (active) setIsLoading(false);
      });
      return () => {
        active = false;
      };
    }

    if (!appConfig.isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    void getSupabase().then((supabase) => {
      if (!active) return;

      void validateAndRefreshSession().then(async ({ accessToken: token, signedOut }) => {
        if (!active) return;
        if (signedOut || !token) {
          setSession(null);
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (!active) return;

        if (!userData.user) {
          await supabase.auth.signOut();
          setSession(null);
        } else {
          setSession({
            access_token: token,
            user: {
              id: userData.user.id,
              email: userData.user.email ?? undefined,
            },
          });
        }
        setIsLoading(false);
      });

      subscription = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === "SIGNED_OUT") {
          setSession(null);
          setProfile(null);
          return;
        }
        setSession(normalizeSession(nextSession));
      }).data.subscription;
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [devAutoSignIn]);

  const switchDevRole = useCallback(
    async (role: UserRole) => {
      if (!appConfig.devBypassAuth) return;
      setDevRole(role);
      setIsLoading(true);
      setError(null);
      try {
        await devAutoSignIn(role);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [devAutoSignIn],
  );

  useEffect(() => {
    if (!accessToken) {
      setProfile(null);
      return;
    }

    void refreshProfile().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Gagal memuat profil";
      setError(message);
    });
  }, [accessToken, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const supabase = await getSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      throw new Error(signInError.message);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const supabase = await getSupabase();
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      throw new Error(signUpError.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const completeOnboarding = useCallback(
    async (role: UserRole, payload: Record<string, unknown>) => {
      if (!accessToken) {
        throw new Error("Sesi login tidak ditemukan");
      }
      const me = await completeProfile(accessToken, {
        role,
        displayName: String(payload.displayName ?? ""),
        phone: payload.phone ? String(payload.phone) : undefined,
        address: payload.address ? String(payload.address) : undefined,
        latitude: payload.latitude ? Number(payload.latitude) : undefined,
        longitude: payload.longitude ? Number(payload.longitude) : undefined,
        district: payload.district ? String(payload.district) : undefined,
        city: payload.city ? String(payload.city) : undefined,
        province: payload.province ? String(payload.province) : undefined,
        businessName: payload.businessName ? String(payload.businessName) : undefined,
        serviceAreaDescription: payload.serviceAreaDescription
          ? String(payload.serviceAreaDescription)
          : undefined,
        baseLatitude: payload.baseLatitude ? Number(payload.baseLatitude) : undefined,
        baseLongitude: payload.baseLongitude ? Number(payload.baseLongitude) : undefined,
        vehicleCapacityKg: payload.vehicleCapacityKg
          ? Number(payload.vehicleCapacityKg)
          : undefined,
        companyName: payload.companyName ? String(payload.companyName) : undefined,
        industryType: payload.industryType ? String(payload.industryType) : undefined,
      });
      setProfile(me);
      return me;
    },
    [accessToken],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      accessToken,
      isLoading,
      isConfigured: appConfig.isSupabaseConfigured,
      error,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      completeOnboarding,
      clearError: () => setError(null),
      switchDevRole: appConfig.devBypassAuth ? switchDevRole : undefined,
    }),
    [
      session,
      profile,
      accessToken,
      isLoading,
      error,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      completeOnboarding,
      switchDevRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthContext;
}

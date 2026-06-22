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

import { ApiError } from "@/lib/api/client";
import { completeProfile, getMe } from "@/lib/api/services";
import type { MeResponse, UserRole } from "@/lib/api/types";
import { appConfig } from "@/lib/config";

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
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;

  const refreshProfile = useCallback(async (): Promise<MeResponse | null> => {
    if (!accessToken) {
      setProfile(null);
      return null;
    }

    try {
      const me = await getMe(accessToken);
      setProfile(me);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.code === "PROFILE_MISSING") {
        setProfile(null);
        return null;
      }
      throw err;
    }
  }, [accessToken]);

  useEffect(() => {
    if (!appConfig.isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    void getSupabase().then((supabase) => {
      if (!active) return;

      void supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(normalizeSession(data.session));
        setIsLoading(false);
      });

      subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(normalizeSession(nextSession));
      }).data.subscription;
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

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
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthContext;
}

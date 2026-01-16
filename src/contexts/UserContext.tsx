import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ===================== TYPES ===================== */
import { type User } from "../types";

interface UserContextType {
  user?: User;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    otherPersonalInfo: { phone?: string; organization?: string; role?: string },
  ) => Promise<void>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshUser: () => Promise<User | null>;
}

/* ===================== CONTEXT ===================== */

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

/* ===================== PROVIDER ===================== */

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);
  const refreshTimeout = useRef<number | null>(null);

  /* ---------- Load user from storage ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed: User = JSON.parse(stored);
      if (parsed.expires_at > Date.now()) {
        setUser(parsed);
      } else {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  /* ---------- Schedule refresh ---------- */
  useEffect(() => {
    if (!user) return;

    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    const refreshIn = user.expires_at - Date.now() - 60_000;

    if (refreshIn <= 0) {
      refreshToken();
      return;
    }

    refreshTimeout.current = window.setTimeout(refreshToken, refreshIn);

    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }
    };
  }, [user]);

  /* ===================== AUTH ACTIONS ===================== */

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BACKEND_URL}/authentication/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }

    const data = await res.json();
    console.log("Login data:", data);
    const expiresAt = Date.now() + data.expires_in * 1000;

    const u: User = {
      name: data.user.name,
      email: data.user.email,
      token: data.access_token,
      expires_at: expiresAt,
      membership_plan: data.user.membership_plan,
      membership_status: data.user.membership_status,
      id: data.user.id,
      avatar_url: data.user.avatar_url,
      credits: data.user.credits,
      credits_reset_at: data.user.credits_reset_at,
      membership_active_until: data.user.membership_active_until,
      role: data.user.role,
      status: data.user.status,
      is_email_verified: data.user.is_email_verified,
      suspended_at: data.user.suspended_at,
      suspended_reason: data.user.suspended_reason,
      suspended_by: data.user.suspended_by,
      stripe_customer_id: data.user.stripe_customer_id,
      total_credits_used: data.user.total_credits_used,
      last_login_at: data.user.last_login_at,
      login_count: data.user.login_count,
      admin_notes: data.user.admin_notes,
      total_courses: data.user.total_courses,
      total_roadmaps: data.user.total_roadmaps,
      completed_courses: data.user.completed_courses,
      created_at: data.user.created_at,
      updated_at: data.user.updated_at,
      deleted_at: data.user.deleted_at,
    };

    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    personal_info: { phone?: string; organization?: string; role?: string },
  ) => {
    const res = await fetch(`${BACKEND_URL}/authentication/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, ...personal_info }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Signup failed");
    }

    await login(email, password);
  };

  const logout = async () => {
    try {
      // Tell backend to delete refresh token from Redis
      await fetch(`${BACKEND_URL}/authentication/logout`, {
        method: "POST",
        credentials: "include", // send HttpOnly cookie
      });
    } catch (err) {
      console.error("Logout failed", err);
    }

    // Clear frontend state
    setUser(undefined);
    localStorage.removeItem("user");
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
  };

  /* ---------- Refresh token ---------- */
  const refreshToken = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/authentication/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = await res.json();
      const expiresAt = Date.now() + data.expires_in * 1000;

      setUser((prev) => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          token: data.access_token,
          expires_at: expiresAt,
        };

        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch {
      logout();
    }
  };

  /* ---------- Refresh user data ---------- */
  const refreshUser = async (): Promise<User | null> => {
    if (!user) return null;

    try {
      console.log("🔄 Fetching fresh user data...");
      const res = await fetch(`${BACKEND_URL}/authentication/me`, {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        cache: "no-store", // Prevent caching
      });

      if (!res.ok) {
        console.error("Failed to refresh user data");
        logout();
        return null;
      }

      const data = await res.json();
      console.log("Fresh user data received:", data);

      // Create updated user object, preserving token and expiration
      const updated: User = {
        ...data,
        token: user.token,
        expires_at: user.expires_at,
      };

      console.log("Membership status:", {
        plan: updated.membership_plan,
        status: updated.membership_status,
      });

      // Update state and localStorage
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      return updated;
    } catch (error) {
      console.error("Error refreshing user:", error);
      return null;
    }
  };

  /* ---------- Auth-aware fetch ---------- */
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${user?.token}`,
      },
      credentials: "include",
    });

    if (res.status !== 401) return res;

    // try refresh once
    await refreshToken();

    const retry = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${user?.token}`,
      },
      credentials: "include",
    });

    if (retry.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }

    return retry;
  };

  /* ===================== DERIVED ===================== */

  const isAuthenticated = !!user && user.expires_at > Date.now();

  /* ===================== PROVIDER ===================== */

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        authFetch,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

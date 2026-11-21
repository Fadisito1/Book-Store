"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("bookstore_token");
    if (!stored) { setLoading(false); return; }
    setToken(stored);
    apiRequest<{ user: AuthUser }>("/api/auth/me", {}, stored)
      .then((data) => setUser(data.user))
      .catch(() => { localStorage.removeItem("bookstore_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  async function saveSession(data: { token: string; user: AuthUser }) {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("bookstore_token", data.token);
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST", body: JSON.stringify({ email, password })
    });
    await saveSession(data);
  }

  async function register(name: string, email: string, password: string) {
    const data = await apiRequest<{ token: string; user: AuthUser }>("/api/auth/register", {
      method: "POST", body: JSON.stringify({ name, email, password })
    });
    await saveSession(data);
  }

  function logout() {
    setToken(null); setUser(null); localStorage.removeItem("bookstore_token");
  }

  const value = { user, token, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}

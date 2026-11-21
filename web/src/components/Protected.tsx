"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/lib/types";
import { canAccessProtectedRoute } from "@/lib/routeProtection";

export function Protected({ children, role }: { children: React.ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && role && user.role !== role) router.replace("/");
  }, [loading, user, role, router]);

  if (loading) return <div className="py-20 text-center text-slate-500">Verificando sesión…</div>;
  if (!canAccessProtectedRoute(user, role)) return null;
  return <>{children}</>;
}

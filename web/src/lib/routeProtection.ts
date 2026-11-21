import type { Role } from "./types";

export function canAccessProtectedRoute(user: { role: Role } | null, requiredRole?: Role) {
  return Boolean(user && (!requiredRole || user.role === requiredRole));
}

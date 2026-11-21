import { describe, expect, it } from "vitest";
import { canAccessProtectedRoute } from "./routeProtection";

describe("protección de rutas", () => {
  it("rechaza usuarios no autenticados", () => {
    expect(canAccessProtectedRoute(null)).toBe(false);
  });

  it("permite al cliente una ruta de cliente", () => {
    expect(canAccessProtectedRoute({ role: "cliente" }, "cliente")).toBe(true);
  });

  it("rechaza al cliente en una ruta de administrador", () => {
    expect(canAccessProtectedRoute({ role: "cliente" }, "admin")).toBe(false);
  });

  it("permite al administrador su ruta", () => {
    expect(canAccessProtectedRoute({ role: "admin" }, "admin")).toBe(true);
  });
});

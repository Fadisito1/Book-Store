import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("adjunta el JWT a las solicitudes autenticadas", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest<{ ok: boolean }>("/api/orders/me", {}, "jwt-token");

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer jwt-token");
  });

  it("convierte errores del backend en mensajes legibles", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: "Stock insuficiente" }
    }), { status: 409, headers: { "Content-Type": "application/json" } })));

    await expect(apiRequest("/api/orders", { method: "POST", body: "{}" })).rejects.toThrow("Stock insuficiente");
  });
});

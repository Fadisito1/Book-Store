import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { registerSchema, loginSchema } from "./schemas/auth";
import { createApp } from "./app";

process.env.JWT_SECRET = "test-secret-long-enough";

describe("Sprint 1 - autenticación", () => {
  it("acepta registro público solo como cliente por ausencia de rol", () => {
    const input = registerSchema.parse({
      name: "Ana Cliente",
      email: "ANA@EXAMPLE.COM",
      password: "contraseñaSegura123"
    });

    expect(input.email).toBe("ana@example.com");
  });

  it("rechaza un rol enviado en el registro público", () => {
    expect(() => registerSchema.parse({
      name: "Ana",
      email: "ana@example.com",
      password: "contraseñaSegura123",
      role: "admin"
    })).toThrow();
  });

  it("rechaza contraseñas cortas y datos de login inválidos", () => {
    expect(() => registerSchema.parse({ name: "Ana", email: "ana@example.com", password: "123" })).toThrow();
    expect(() => loginSchema.parse({ email: "correo-invalido", password: "abc" })).toThrow();
  });

  it("genera un hash bcrypt distinto de la contraseña", async () => {
    const hash = await bcrypt.hash("contraseñaSegura123", 12);
    expect(hash).not.toBe("contraseñaSegura123");
    expect(await bcrypt.compare("contraseñaSegura123", hash)).toBe(true);
  });

  it("expone la salud y rechaza credenciales sin autenticación", async () => {
    const app = createApp();

    await request(app).get("/health").expect(200, { status: "ok" });
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/auth/admin-check").expect(401);
  });

  it("rechaza solicitudes de registro inválidas antes de acceder a MongoDB", async () => {
    const app = createApp();

    await request(app)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@example.com", password: "123", role: "admin" })
      .expect(400);
  });

  it("firma y verifica el JWT con rol", () => {
    const token = jwt.sign({ role: "cliente" }, process.env.JWT_SECRET!, {
      subject: "507f1f77bcf86cd799439011",
      expiresIn: "7d"
    });
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    expect(payload.sub).toBe("507f1f77bcf86cd799439011");
    expect(payload.role).toBe("cliente");
  });
});

import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createApp } from "./app";
import { orderCreateSchema } from "./schemas/catalog";
import { Order } from "./models/Order";
import { Book } from "./models/Book";

process.env.JWT_SECRET = "test-secret-long-enough";

describe("Sprint 2 - catálogo y pedidos", () => {
  it("rechaza precio alterado por el cliente", () => {
    expect(() => orderCreateSchema.parse({
      items: [{ bookId: "507f1f77bcf86cd799439011", quantity: 1, price: 0.01 }]
    })).toThrow();
  });

  it("rechaza cantidades negativas y cero", () => {
    expect(() => orderCreateSchema.parse({
      items: [{ bookId: "507f1f77bcf86cd799439011", quantity: -1 }]
    })).toThrow();
    expect(() => orderCreateSchema.parse({
      items: [{ bookId: "507f1f77bcf86cd799439011", quantity: 0 }]
    })).toThrow();
  });

  it("rechaza crear pedidos sin autenticación", async () => {
    const app = createApp();
    await request(app).post("/api/orders").send({
      items: [{ bookId: "507f1f77bcf86cd799439011", quantity: 1 }]
    }).expect(401);
  });

  it("rechaza listar pedidos sin autenticación", async () => {
    const app = createApp();
    await request(app).get("/api/orders/me").expect(401);
  });

  it("filtra pedidos por el usuario autenticado", async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const otherId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ role: "cliente" }, process.env.JWT_SECRET!, { subject: ownerId });

    const findSpy = vi.spyOn(Order, "find").mockImplementation(() => {
      const query = {
        sort: vi.fn().mockResolvedValue([
          { user: ownerId, total: 20 }
        ])
      };
      return query as never;
    });

    const app = createApp();
    const response = await request(app)
      .get("/api/orders/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.orders.every((order: { user: string }) => order.user === ownerId)).toBe(true);
    expect(response.body.orders.every((order: { user: string }) => order.user !== otherId)).toBe(true);
    expect(findSpy).toHaveBeenCalledWith({ user: ownerId });
    findSpy.mockRestore();
  });

  it("permite consultar libros públicamente y rechazar modificación sin admin", async () => {
    const findSpy = vi.spyOn(Book, "find").mockImplementation(() => ({
      sort: vi.fn().mockResolvedValue([])
    }) as never);
    const app = createApp();

    await request(app).get("/api/books").expect(200);
    await request(app).get("/api/books?category=novela").expect(200);
    await request(app).post("/api/books").send({}).expect(401);
    findSpy.mockRestore();
  });
});

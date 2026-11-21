import { describe, expect, it, vi, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "./app";
import { Order } from "./models/Order";

process.env.JWT_SECRET = "test-secret-long-enough";

afterEach(() => vi.restoreAllMocks());

function mockAdminOrders() {
  vi.spyOn(Order, "find").mockImplementation(() => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };
    return query as never;
  });
}

describe("GET /api/orders - administración", () => {
  it("devuelve 401 sin token", async () => {
    await request(createApp()).get("/api/orders").expect(401);
  });

  it("devuelve 403 para un cliente", async () => {
    const token = jwt.sign({ role: "cliente" }, process.env.JWT_SECRET!, {
      subject: new mongoose.Types.ObjectId().toString()
    });

    await request(createApp())
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("devuelve 200 para admin", async () => {
    mockAdminOrders();
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      subject: new mongoose.Types.ObjectId().toString()
    });

    const response = await request(createApp())
      .get("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ orders: [] });
  });

  it("aplica el filtro de estado de envío", async () => {
    const findSpy = vi.spyOn(Order, "find").mockImplementation(() => {
      const query = {
        sort: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([])
      };
      return query as never;
    });
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      subject: new mongoose.Types.ObjectId().toString()
    });

    await request(createApp())
      .get("/api/orders?shippingStatus=Enviado")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(findSpy).toHaveBeenCalledWith({ shippingStatus: "Enviado" });
  });
});

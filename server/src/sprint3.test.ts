import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "./app";
import { validateCapturedAmount } from "./services/paypal";
import { validateShippingTransition } from "./services/shipping";
import { Order } from "./models/Order";

process.env.JWT_SECRET = "test-secret-long-enough";

describe("Sprint 3 - PayPal y envíos", () => {
  it("acepta una captura aprobada con importe correcto", () => {
    expect(validateCapturedAmount({ status: "COMPLETED", amount: "25.50", currency: "USD" }, 25.5)).toBe(true);
  });

  it("rechaza importe alterado o moneda distinta", () => {
    expect(validateCapturedAmount({ status: "COMPLETED", amount: "1.00", currency: "USD" }, 25.5)).toBe(false);
    expect(validateCapturedAmount({ status: "COMPLETED", amount: "25.50", currency: "EUR" }, 25.5)).toBe(false);
  });

  it("rechaza pedido ajeno al crear la orden PayPal", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ role: "cliente" }, process.env.JWT_SECRET!, { subject: userId });
    vi.spyOn(Order, "findOne").mockResolvedValue(null);

    await request(createApp())
      .post("/api/payments/paypal/order")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: new mongoose.Types.ObjectId().toString() })
      .expect(404);

    vi.restoreAllMocks();
  });

  it("impide cambiar de estado un pedido no pagado", () => {
    expect(() => validateShippingTransition(false, "Pendiente", "Procesando")).toThrow("pedido no está pagado");
  });

  it("rechaza transición inválida", () => {
    expect(() => validateShippingTransition(true, "Pendiente", "Entregado")).toThrow("Transición de estado");
  });

  it("exige guía al pasar a Enviado", () => {
    expect(() => validateShippingTransition(true, "Procesando", "Enviado")).toThrow("número de guía");
  });

  it("permite la transición pagada y secuencial", () => {
    expect(() => validateShippingTransition(true, "Pendiente", "Procesando")).not.toThrow();
    expect(() => validateShippingTransition(true, "Procesando", "Enviado", "TRACK-123")).not.toThrow();
  });

  it("rechaza captura repetida sin datos ni autenticación", async () => {
    await request(createApp())
      .post("/api/payments/paypal/capture")
      .send({ paypalOrderId: "PAYPAL-123" })
      .expect(401);
  });
});

import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { AppError } from "../middleware/errors";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { Book } from "../models/Book";
import { capturePaypalOrder, createPaypalOrder, validateCapturedAmount } from "../services/paypal";
import { emitOrderCreated, emitOrderUpdated } from "../services/realtime";

export const paymentsRouter = Router();

paymentsRouter.use(authenticate);

const orderIdSchema = z.object({ orderId: z.string().min(1) }).strict();
const captureSchema = z.object({
  paypalOrderId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional()
}).refine((value) => value.paypalOrderId || value.orderId, { message: "Debe indicar PayPal o el pedido" }).strict();

paymentsRouter.post("/paypal/order", async (req, res, next) => {
  try {
    const { orderId } = orderIdSchema.parse(req.body);
    if (!mongoose.isValidObjectId(orderId)) throw new AppError(400, "Pedido inválido");
    const order = await Order.findOne({ _id: orderId, user: req.auth?.sub });
    if (!order) throw new AppError(404, "Pedido no encontrado");
    if (order.paymentStatus === "pagado") throw new AppError(409, "El pedido ya está pagado");

    const paypalOrderId = await createPaypalOrder(order.total);
    await Payment.findOneAndUpdate(
      { order: order._id },
      { providerOrderId: paypalOrderId, status: "PENDING", amount: order.total, currency: "USD" },
      { upsert: true, new: true }
    );

    res.status(201).json({ paypalOrderId });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.post("/paypal/capture", async (req, res, next) => {
  try {
    const input = captureSchema.parse(req.body);
    let paypalOrderId = input.paypalOrderId;

    if (!paypalOrderId && input.orderId) {
      if (!mongoose.isValidObjectId(input.orderId)) throw new AppError(400, "Pedido inválido");
      const paymentByOrder = await Payment.findOne({ order: input.orderId });
      paypalOrderId = paymentByOrder?.providerOrderId;
    }
    if (!paypalOrderId) throw new AppError(404, "Orden de PayPal no encontrada");

    const existing = await Payment.findOne({ providerOrderId: paypalOrderId });
    if (existing?.status === "CAPTURED") {
      const order = await Order.findById(existing.order);
      if (!order || String(order.user) !== req.auth?.sub) throw new AppError(403, "No autorizado");
      return res.json({ status: "CAPTURED", idempotent: true, orderId: String(order._id) });
    }

    const capture = await capturePaypalOrder(paypalOrderId);
    const payment = await Payment.findOne({ providerOrderId: paypalOrderId });
    if (!payment) throw new AppError(404, "Pago no encontrado");

    const order = await Order.findById(payment.order);
    if (!order || String(order.user) !== req.auth?.sub) throw new AppError(403, "No autorizado");
    if (capture.status !== "COMPLETED") throw new AppError(402, "El pago no fue aprobado");

    if (!validateCapturedAmount(capture, order.total)) {
      await Payment.updateOne({ _id: payment._id }, { status: "FAILED" });
      throw new AppError(422, "La captura no coincide con el pedido");
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
          const paidUpdate = await Order.updateOne(
            { _id: order._id, paymentStatus: "pendiente" },
            { paymentStatus: "pagado", paidAt: new Date() },
            { session }
          );
          if (paidUpdate.modifiedCount !== 1) {
            throw new AppError(409, "El pedido ya fue capturado");
          }

          for (const item of order.items) {
            const updated = await Book.findOneAndUpdate(
            { _id: item.book, active: true, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );
          if (!updated) throw new AppError(409, `Stock insuficiente para: ${item.titleSnapshot}`);
        }

        await Payment.updateOne(
          { _id: payment._id, status: { $ne: "CAPTURED" } },
          { status: "CAPTURED", providerPaymentId: capture.captureId || "", captureId: capture.captureId || "" },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    const paidOrder = await Order.findById(order._id);
    const io = req.app.locals.io;
    if (paidOrder) {
      emitOrderCreated(io, paidOrder);
      emitOrderUpdated(io, paidOrder);
    }

    res.json({ status: "CAPTURED", idempotent: false, orderId: String(order._id) });
  } catch (error) {
    next(error);
  }
});

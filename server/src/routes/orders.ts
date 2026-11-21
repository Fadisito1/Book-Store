import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth";
import { AppError } from "../middleware/errors";
import { Order } from "../models/Order";
import { orderCreateSchema } from "../schemas/catalog";
import { createCalculatedOrder } from "../services/order";
import { emitOrderStatusChanged, emitOrderUpdated } from "../services/realtime";
import { validateShippingTransition } from "../services/shipping";

export const ordersRouter = Router();

ordersRouter.use(authenticate);

ordersRouter.post("/", async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new AppError(401, "Token requerido");
    const input = orderCreateSchema.parse(req.body);
    const order = await createCalculatedOrder(req.auth.sub, input.items);
    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const input = z.object({
      shippingStatus: z.enum(["Pendiente", "Procesando", "Enviado", "Entregado"]).optional()
    }).strict().parse(req.query);

    const filter: Record<string, unknown> = {};
    if (input.shippingStatus) filter.shippingStatus = input.shippingStatus;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .select("_id user items.titleSnapshot items.quantity total paymentStatus shippingStatus trackingNumber createdAt paidAt updatedAt")
      .lean();

    res.json({
      orders: orders.map((order) => ({
        id: String(order._id),
        user: String(order.user),
        items: order.items.map((item) => ({ title: item.titleSnapshot, quantity: item.quantity })),
        total: order.total,
        paymentStatus: order.paymentStatus,
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber || "",
        createdAt: order.createdAt,
        paidAt: order.paidAt || null,
        updatedAt: order.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch("/:id/status", authorize("admin"), async (req, res, next) => {
  try {
    const input = z.object({
      shippingStatus: z.enum(["Pendiente", "Procesando", "Enviado", "Entregado"]),
      trackingNumber: z.string().trim().max(100).optional()
    }).strict().parse(req.body);

    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError(404, "Pedido no encontrado");
    if (order.paymentStatus !== "pagado") throw new AppError(409, "El pedido no está pagado");

    validateShippingTransition(
      order.paymentStatus === "pagado",
      order.shippingStatus,
      input.shippingStatus,
      input.trackingNumber
    );

    order.shippingStatus = input.shippingStatus;
    if (input.shippingStatus === "Enviado") order.trackingNumber = input.trackingNumber!;
    await order.save();

    const io = req.app.locals.io;
    emitOrderStatusChanged(io, order);
    emitOrderUpdated(io, order);
    res.json({ order: { id: String(order._id), paymentStatus: order.paymentStatus, shippingStatus: order.shippingStatus, trackingNumber: order.trackingNumber } });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/me", async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new AppError(401, "Token requerido");
    const orders = await Order.find({ user: req.auth.sub }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

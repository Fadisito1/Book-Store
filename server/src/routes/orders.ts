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

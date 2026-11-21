import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { AppError } from "../middleware/errors";
import { Order } from "../models/Order";
import { orderCreateSchema } from "../schemas/catalog";
import { createCalculatedOrder } from "../services/order";

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

ordersRouter.get("/me", async (req, res, next) => {
  try {
    if (!req.auth?.sub) throw new AppError(401, "Token requerido");
    const orders = await Order.find({ user: req.auth.sub }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

import mongoose from "mongoose";
import { Book } from "../models/Book";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { AppError } from "../middleware/errors";

export interface OrderItemInput {
  bookId: string;
  quantity: number;
}

export async function createCalculatedOrder(userId: string, items: OrderItemInput[]) {
  const session = await mongoose.startSession();

  try {
    let createdOrderId: mongoose.Types.ObjectId | undefined;

    await session.withTransaction(async () => {
      const snapshots = [];
      let total = 0;

      for (const item of items) {
        if (!mongoose.isValidObjectId(item.bookId)) {
          throw new AppError(400, "Identificador de libro inválido");
        }

        const book = await Book.findOne({ _id: item.bookId, active: true }).session(session);
        if (!book) throw new AppError(404, "Libro no encontrado");
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new AppError(400, "La cantidad debe ser un entero positivo");
        }
        if (book.stock < item.quantity) {
          throw new AppError(409, `Stock insuficiente para: ${book.title}`);
        }

        const price = Number(book.price);
        snapshots.push({
          book: book._id,
          titleSnapshot: book.title,
          priceSnapshot: price,
          quantity: item.quantity
        });
        total += price * item.quantity;
      }

      const order = await Order.create([{ user: userId, items: snapshots, total, shippingStatus: "Pendiente", trackingNumber: "" }], { session });
      createdOrderId = order[0]._id;
      await Payment.create([{ order: createdOrderId, provider: "paypal", status: "PENDING", amount: total, currency: "USD" }], { session });
    });

    if (!createdOrderId) throw new AppError(500, "No se pudo crear el pedido");
    return Order.findById(createdOrderId).lean();
  } finally {
    await session.endSession();
  }
}

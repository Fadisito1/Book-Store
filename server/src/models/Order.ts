import mongoose, { InferSchemaType, Model } from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    titleSnapshot: { type: String, required: true, trim: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true, validate: [(items: unknown[]) => items.length > 0, "El pedido debe tener productos"] },
    total: { type: Number, required: true, min: 0 },
    shippingStatus: {
      type: String,
      enum: ["Pendiente", "Procesando", "Enviado", "Entregado"],
      default: "Pendiente",
      required: true
    },
    trackingNumber: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export type OrderDocument = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId };
export const Order: Model<OrderDocument> =
  (mongoose.models.Order as Model<OrderDocument>) || mongoose.model<OrderDocument>("Order", orderSchema);

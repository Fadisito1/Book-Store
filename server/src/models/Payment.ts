import mongoose, { InferSchemaType, Model } from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    provider: { type: String, enum: ["paypal"], required: true, default: "paypal" },
    status: { type: String, enum: ["PENDING", "CAPTURED", "FAILED"], required: true, default: "PENDING" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, default: "USD" },
    providerOrderId: { type: String, trim: true, default: "" },
    providerPaymentId: { type: String, trim: true, default: "" },
    captureId: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & { _id: mongoose.Types.ObjectId };
export const Payment: Model<PaymentDocument> =
  (mongoose.models.Payment as Model<PaymentDocument>) || mongoose.model<PaymentDocument>("Payment", paymentSchema);

import mongoose, { InferSchemaType, Model } from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    author: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text", category: 1 });

export type BookDocument = InferSchemaType<typeof bookSchema> & { _id: mongoose.Types.ObjectId };
export const Book: Model<BookDocument> =
  (mongoose.models.Book as Model<BookDocument>) || mongoose.model<BookDocument>("Book", bookSchema);
